import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import mammoth from 'mammoth';
import { saveAs } from 'file-saver';
import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import 'react-quill/dist/quill.snow.css';
import { authorsApi, booksApi, uploadsApi, genresApi, bookChaptersApi } from '../../services/api';
import './BookEditor.css';

const editorModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    [{ script: 'sub' }, { script: 'super' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
  clipboard: {
    matchVisual: false,
  },
};

const editorFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'list',
  'bullet',
  'indent',
  'align',
  'script',
  'blockquote',
  'code-block',
  'link',
];

function toEditorHtml(value) {
  if (!value) return '';
  const looksLikeHtml = /<[^>]+>/.test(value);
  return looksLikeHtml ? value : `<p>${value}</p>`;
}

function getPlainTextFromHtml(value) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createChapter(chapterNumber, title = '', content = '', titleAlign = 'left') {
  return {
    id: Date.now() + chapterNumber,
    title,
    content,
    titleAlign,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getNodeHtml(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    return text.trim() ? `<p>${escapeHtml(text)}</p>` : '';
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    return node.outerHTML;
  }

  return '';
}

function normalizeImportedHtml(html) {
  if (!html) {
    return '<p></p>';
  }

  return html
    .replace(/<p>\s*<\/p>/gi, '<p><br></p>')
    .replace(/<p>\s*&nbsp;\s*<\/p>/gi, '<p><br></p>')
    .trim();
}

function getSafeFilename(value) {
  const normalized = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return normalized || 'book';
}

function buildMergedDescription(chapters) {
  return chapters
    .map((chapter) => {
      const headingStyle =
        chapter.titleAlign && chapter.titleAlign !== 'left'
          ? ` style="text-align:${chapter.titleAlign};"`
          : '';

      return `<h2${headingStyle}>${escapeHtml(chapter.title)}</h2>${chapter.content}`;
    })
    .join('');
}

function mapAlignToDocx(align) {
  if (align === 'center') return AlignmentType.CENTER;
  if (align === 'right') return AlignmentType.RIGHT;
  if (align === 'justify') return AlignmentType.JUSTIFIED;
  return AlignmentType.LEFT;
}

function safeText(raw) {
  return (raw || '')
    .replace(/\u00A0/g, ' ')  // non-breaking space
    .replace(/\t/g, '    ')    // tab → 4 spaces
    .replace(/\r?\n/g, ' ')    // newlines → space
    .trim();
}

function getClassAlign(cls) {
  if (/ql-align-center/.test(cls)) return AlignmentType.CENTER;
  if (/ql-align-right/.test(cls)) return AlignmentType.RIGHT;
  if (/ql-align-justify/.test(cls)) return AlignmentType.JUSTIFIED;
  return AlignmentType.LEFT;
}

// Safely create a TextRun — strips any control chars that crash docx
function safeRun(opts) {
  const text = (opts.text || '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  return new TextRun({ ...opts, text });
}

// Walk inline nodes and collect runs — safely, no .options access
function collectRuns(node, fmt) {
  const f = fmt || {};
  if (node.nodeType === Node.TEXT_NODE) {
    const text = safeText(node.textContent || '');
    if (!text) return [];
    return [safeRun({
      text,
      bold: f.bold || false,
      italics: f.italics || false,
      underline: f.underline ? {} : undefined,
      strike: f.strike || false,
    })];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const tag = node.tagName.toLowerCase();
  if (tag === 'br') return [safeRun({ text: '', break: 1 })];
  const next = { ...f };
  if (tag === 'strong' || tag === 'b') next.bold = true;
  if (tag === 'em' || tag === 'i') next.italics = true;
  if (tag === 'u') next.underline = true;
  if (tag === 's' || tag === 'del' || tag === 'strike') next.strike = true;
  const runs = [];
  node.childNodes.forEach((child) => runs.push(...collectRuns(child, next)));
  return runs;
}

function elementToParagraphs(element) {
  const tag = element.tagName.toLowerCase();
  const cls = element.getAttribute('class') || '';
  const align = getClassAlign(cls);

  // Lists
  if (tag === 'ul' || tag === 'ol') {
    const items = Array.from(element.querySelectorAll('li'));
    if (!items.length) return [new Paragraph({ children: [safeRun({ text: '' })] })];
    return items.map((li, i) => {
      const text = safeText(li.textContent || '');
      const prefix = tag === 'ol' ? `${i + 1}. ` : '• ';
      return new Paragraph({
        spacing: { after: 100 },
        children: [safeRun({ text: prefix + text })],
      });
    });
  }

  // Headings inside chapter content
  if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
    const sizeMap = { h1: 32, h2: 28, h3: 26, h4: 24 };
    const text = safeText(element.textContent || '');
    return [new Paragraph({
      alignment: align,
      spacing: { before: 240, after: 120 },
      children: [safeRun({ text: text || '', bold: true, size: sizeMap[tag] })],
    })];
  }

  // Skip elements with no meaningful text (tables, figures, etc.)
  if (['table', 'figure', 'img', 'video', 'audio', 'canvas', 'svg'].includes(tag)) {
    const text = safeText(element.textContent || '');
    if (!text) return [];
    return [new Paragraph({ children: [safeRun({ text })] })];
  }

  // Regular paragraph-like elements
  const runs = collectRuns(element, {});
  const validRuns = runs.filter(Boolean);
  return [new Paragraph({
    alignment: align,
    spacing: { after: 160 },
    children: validRuns.length ? validRuns : [safeRun({ text: '' })],
  })];
}

function createDocxParagraphsFromHtml(html) {
  if (!html) return [new Paragraph({ children: [safeRun({ text: '' })] })];

  try {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(`<body>${html}</body>`, 'text/html');
    const body = parsed.body;
    if (!body) throw new Error('parse failed');

    const result = [];
    body.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = safeText(node.textContent || '');
        if (text) result.push(new Paragraph({ children: [safeRun({ text })] }));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        try {
          const paras = elementToParagraphs(node);
          if (paras && paras.length) result.push(...paras);
        } catch {
          // fallback: extract plain text from the failing element
          const text = safeText(node.textContent || '');
          if (text) result.push(new Paragraph({ children: [safeRun({ text })] }));
        }
      }
    });

    return result.length ? result : [new Paragraph({ children: [safeRun({ text: '' })] })];
  } catch {
    // Last resort: strip all HTML tags, split by newlines
    const plain = (html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    return plain.split('\n').map((line) => {
      const text = safeText(line);
      return new Paragraph({ children: [safeRun({ text: text || '' })] });
    });
  }
}

function isBabStyleTitle(text) {
  if (!text) {
    return false;
  }

  const normalized = text.replace(/\s+/g, ' ').trim();
  return /^(BAB\s+[IVXLCDM0-9]+(?:\s*[:.-]?\s*.*)?|CHAPTER\s+[IVXLCDM0-9]+(?:\s*[:.-]?\s*.*)?)$/i.test(
    normalized,
  );
}

function isChapterHeadingNode(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  const tagName = node.tagName?.toLowerCase();
  if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
    return true;
  }

  if (tagName === 'p') {
    const text = node.textContent?.trim() || '';
    return isBabStyleTitle(text);
  }

  return false;
}

function getNodeTextAlign(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return 'left';
  }

  const alignAttr = node.getAttribute('align')?.toLowerCase();
  if (alignAttr === 'left' || alignAttr === 'center' || alignAttr === 'right' || alignAttr === 'justify') {
    return alignAttr;
  }

  const styleAttr = node.getAttribute('style')?.toLowerCase() || '';
  const styleMatch = styleAttr.match(/text-align\s*:\s*(left|center|right|justify)/);
  if (styleMatch?.[1]) {
    return styleMatch[1];
  }

  const className = node.getAttribute('class') || '';
  if (className.includes('ql-align-center')) return 'center';
  if (className.includes('ql-align-right')) return 'right';
  if (className.includes('ql-align-justify')) return 'justify';

  return 'left';
}

function splitHtmlIntoChapters(html) {
  if (!html) {
    return [createChapter(1, 'Chapter 1', '<p></p>')];
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<div id="doc-root">${html}</div>`, 'text/html');
  const root = parsed.getElementById('doc-root');

  if (!root) {
    return [createChapter(1, 'Chapter 1', html)];
  }

  const chapters = [];
  let currentChapterTitle = 'Chapter 1';
  let currentChapterContent = '';
  let currentChapterTitleAlign = 'left';
  let hasStartedChapter = false;

  Array.from(root.childNodes).forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.TEXT_NODE) {
      return;
    }

    const nodeHtml = getNodeHtml(node);
    if (!nodeHtml) {
      return;
    }

    const isHeading = isChapterHeadingNode(node);

    if (isHeading) {
      if (hasStartedChapter || currentChapterContent.trim()) {
        chapters.push(
          createChapter(
            chapters.length + 1,
            currentChapterTitle,
            normalizeImportedHtml(currentChapterContent),
            currentChapterTitleAlign,
          ),
        );
      }
      currentChapterTitle = node.textContent?.trim() || `Chapter ${chapters.length + 1}`;
      currentChapterTitleAlign = getNodeTextAlign(node);
      currentChapterContent = '';
      hasStartedChapter = true;
    } else {
      currentChapterContent += nodeHtml;
    }
  });

  if (hasStartedChapter || currentChapterContent.trim() || chapters.length === 0) {
    chapters.push(
      createChapter(
        chapters.length + 1,
        currentChapterTitle,
        normalizeImportedHtml(currentChapterContent),
        currentChapterTitleAlign,
      ),
    );
  }

  return chapters;
}

function BookEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [authors, setAuthors] = useState([]);
  const [genres, setGenres] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [saveError, setSaveError] = useState('');

  const [form, setForm] = useState({
    title: '',
    authorId: '',
    genre: '',
    publishedYear: '',
    pages: '',
    isbn: '',
    price: '',
    featured: false,
    cover: '',
    chapters: [createChapter(1, '', '')],
  });

  const [errors, setErrors] = useState({});
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState('');
  const [useRichEditor, setUseRichEditor] = useState(true);
  const [sellableChapters, setSellableChapters] = useState([]);

  useEffect(() => {
    const fetches = [authorsApi.list(), genresApi.list()];
    if (isEditing) fetches.push(booksApi.get(id));

    Promise.all(fetches)
      .then(([authorList, genreList, existing]) => {
        setAuthors(authorList);
        setGenres(genreList);
        if (existing) {
          setForm({
            title: existing.title || '',
            authorId: existing.author_id || '',
            genre: existing.genre || '',
            publishedYear: existing.published_year || '',
            pages: existing.pages || '',
            isbn: existing.isbn || '',
            price: existing.price || '',
            featured: existing.featured || false,
            cover: existing.cover || '',
            chapters: [createChapter(1, 'Chapter 1', toEditorHtml(existing.description || ''))],
          });
          // load sellable chapters
          bookChaptersApi.list(id).then(setSellableChapters).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [id, isEditing]);

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.authorId) errs.authorId = 'Author is required.';
    if (!form.genre) errs.genre = 'Genre is required.';
    if (!form.publishedYear || isNaN(Number(form.publishedYear))) errs.publishedYear = 'Valid year required.';
    if (!form.pages || isNaN(Number(form.pages))) errs.pages = 'Valid page count required.';
    if (!form.price || isNaN(Number(form.price))) errs.price = 'Valid price required.';
    return errs;
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const mergedDescription = buildMergedDescription(form.chapters);
    const payload = {
      title: form.title,
      author_id: Number(form.authorId),
      genre: form.genre,
      published_year: Number(form.publishedYear),
      pages: Number(form.pages),
      isbn: form.isbn || null,
      price: Number(form.price),
      featured: form.featured,
      cover: form.cover || null,
      description: mergedDescription,
    };

    setSaveError('');
    try {
      let savedId = id;
      if (isEditing) {
        await booksApi.update(id, payload);
      } else {
        const created = await booksApi.create(payload);
        savedId = created.id;
      }
      // save sellable chapters
      if (savedId) {
        await bookChaptersApi.replace(savedId, sellableChapters.map(({ number, title, price }) => ({ number, title, price })));
      }
      navigate('/admin');
    } catch (err) {
      setSaveError(err.message || 'Failed to save book.');
    }
  }

  function handleChapterTitleChange(chapterId, value) {
    setForm((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, title: value } : chapter,
      ),
    }));
  }

  function handleChapterContentChange(chapterId, value) {
    setForm((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, content: value } : chapter,
      ),
    }));
  }

  function handleMoveChapter(chapterId, direction) {
    setForm((prev) => {
      const index = prev.chapters.findIndex((ch) => ch.id === chapterId);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.chapters.length - 1) return prev;

      const updated = [...prev.chapters];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
      return { ...prev, chapters: updated };
    });
  }

  function handleAddChapter() {
    setForm((prev) => ({
      ...prev,
      chapters: [
        ...prev.chapters,
        createChapter(
          prev.chapters.length + 1,
          `Chapter ${prev.chapters.length + 1}`,
          '',
        ),
      ],
    }));
  }

  function handleRemoveChapter(chapterId) {
    setForm((prev) => {
      if (prev.chapters.length <= 1) {
        return prev;
      }

      return {
        ...prev,
        chapters: prev.chapters.filter((chapter) => chapter.id !== chapterId),
      };
    });
  }

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploadError('');
    setIsUploadingCover(true);
    try {
      const result = await uploadsApi.uploadImage(file);
      setForm((prev) => ({ ...prev, cover: result.url }));
    } catch (err) {
      setCoverUploadError(err.message || 'Upload failed.');
    } finally {
      setIsUploadingCover(false);
      e.target.value = '';
    }
  }

  async function handleImportWordFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError('');

    const isDocx =
      file.name.toLowerCase().endsWith('.docx') ||
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (!isDocx) {
      setImportError('Only .docx files are supported for import. Please export your .doc as .docx first.');
      event.target.value = '';
      return;
    }

    try {
      setIsImporting(true);
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          preserveEmptyParagraphs: true,
          includeEmbeddedStyleMap: true,
        },
      );

      const importedChapters = splitHtmlIntoChapters(result.value).map((chapter, index) => ({
        ...chapter,
        title: chapter.title || `Chapter ${index + 1}`,
      }));

      setForm((prev) => ({
        ...prev,
        chapters: importedChapters,
      }));

      if (result.messages?.length) {
        console.info('Word import warnings:', result.messages);
      }
    } catch (error) {
      setImportError('Failed to import this Word file. Please try another .docx file.');
      console.error(error);
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  }

  async function handleExportWordFile() {
    if (isExporting) {
      return;
    }

    try {
      setIsExporting(true);
      setImportError('');

      const plainText = getPlainTextFromHtml(buildMergedDescription(form.chapters));

      if (!plainText) {
        setImportError('Cannot export an empty document. Please add chapter content first.');
        return;
      }

      const authorObj = authors.find((a) => String(a.id) === String(form.authorId)) || null;
      const authorName = authorObj?.name || 'Unknown Author';
      const bookYear = form.publishedYear || new Date().getFullYear();
      const bookTitle = form.title || 'Untitled Book';

      // ── Cover page ───────────────────────────────────────────────────
      const coverParagraphs = [
        // Vertical spacer (~1/3 page)
        ...Array.from({ length: 10 }, () =>
          new Paragraph({ children: [new TextRun('')] }),
        ),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 320 },
          children: [new TextRun({ text: bookTitle, bold: true, size: 52 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
          children: [new TextRun({ text: authorName, size: 28 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [new TextRun({ text: String(bookYear), size: 22, color: '888888' })],
        }),
      ];

      // ── TOC ───────────────────────────────────────────────────────────
      const tocParagraphs = [
        // page break on its own plain paragraph first
        new Paragraph({ pageBreakBefore: true, children: [new TextRun('')] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 480 },
          children: [new TextRun({ text: 'DAFTAR ISI', bold: true, size: 32 })],
        }),
        ...form.chapters.map((chapter, index) =>
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `${index + 1}.  ${chapter.title || `Chapter ${index + 1}`}`,
                size: 24,
              }),
            ],
          }),
        ),
      ];

      // ── Chapters ──────────────────────────────────────────────────────
      const chapterParagraphs = form.chapters.flatMap((chapter, index) => [
        // page break on its own plain paragraph
        new Paragraph({ pageBreakBefore: true, children: [new TextRun('')] }),
        new Paragraph({
          alignment: mapAlignToDocx(chapter.titleAlign),
          spacing: { before: 0, after: 280 },
          children: [
            new TextRun({
              text: chapter.title || `Chapter ${index + 1}`,
              bold: true,
              size: 36,
            }),
          ],
        }),
        ...createDocxParagraphsFromHtml(chapter.content),
      ]);

      // ── Single section — max compatibility ────────────────────────────
      const doc = new Document({
        creator: authorName,
        title: bookTitle,
        sections: [
          {
            properties: {
              page: {
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
              },
            },
            children: [
              ...coverParagraphs,
              ...tocParagraphs,
              ...chapterParagraphs,
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `${getSafeFilename(form.title)}.docx`;

      saveAs(blob, fileName);
    } catch (error) {
      const msg = error?.message || String(error);
      setImportError(`Export failed: ${msg}`);
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }

  if (dataLoading) {
    return <div className="container"><p style={{ padding: '2rem 0' }}>Loading…</p></div>;
  }

  return (
    <div className="book-editor">
      <div className="container">
        <div className="page-header">
          <h1>{isEditing ? `Edit: ${form.title || 'Book'}` : 'Add New Book'}</h1>
          <p>{isEditing ? 'Update book details below.' : 'Fill in the details to add a new book.'}</p>
        </div>
        {saveError && <p className="error-msg" style={{ marginBottom: '1rem' }}>{saveError}</p>}
        <form className="editor-form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input id="title" name="title" type="text" value={form.title} onChange={handleChange} className={errors.title ? 'input-error' : ''} />
              {errors.title && <span className="error-msg">{errors.title}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="authorId">Author *</label>
              <select id="authorId" name="authorId" value={form.authorId} onChange={handleChange} className={errors.authorId ? 'input-error' : ''}>
                <option value="">Select author…</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {errors.authorId && <span className="error-msg">{errors.authorId}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="genre">Genre *</label>
              <select id="genre" name="genre" value={form.genre} onChange={handleChange} className={errors.genre ? 'input-error' : ''}>
                <option value="">Select genre…</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
                <option value="Other">Other</option>
              </select>
              {errors.genre && <span className="error-msg">{errors.genre}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="publishedYear">Published Year *</label>
              <input id="publishedYear" name="publishedYear" type="number" min="1900" max="2100" value={form.publishedYear} onChange={handleChange} className={errors.publishedYear ? 'input-error' : ''} />
              {errors.publishedYear && <span className="error-msg">{errors.publishedYear}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pages">Pages *</label>
              <input id="pages" name="pages" type="number" min="1" value={form.pages} onChange={handleChange} className={errors.pages ? 'input-error' : ''} />
              {errors.pages && <span className="error-msg">{errors.pages}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="price">Price (Rp) *</label>
              <input id="price" name="price" type="number" min="0" value={form.price} onChange={handleChange} className={errors.price ? 'input-error' : ''} />
              {errors.price && <span className="error-msg">{errors.price}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="isbn">ISBN</label>
            <input id="isbn" name="isbn" type="text" value={form.isbn} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Cover Image</label>
            <div className="cover-upload-row">
              <input
                id="cover"
                name="cover"
                type="url"
                placeholder="https://… or upload a file →"
                value={form.cover}
                onChange={handleChange}
                className="cover-url-input"
              />
              <label className={`btn btn-secondary cover-upload-btn${isUploadingCover ? ' disabled' : ''}`} htmlFor="cover-file-input">
                {isUploadingCover ? 'Uploading…' : '📁 Upload'}
              </label>
              <input
                id="cover-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleCoverUpload}
                disabled={isUploadingCover}
                className="file-upload-input"
              />
            </div>
            {coverUploadError && <span className="error-msg">{coverUploadError}</span>}
            {form.cover && (
              <img src={form.cover} alt="Cover preview" className="cover-preview" />
            )}
            <small className="form-hint">Paste a URL or upload an image (JPEG, PNG, WebP, GIF · max 5 MB).</small>
          </div>

          <div className="chapters-section">
            <div className="chapters-section__header">
              <label>Book Chapters <span style={{color:'var(--color-text-muted)',fontWeight:400,fontSize:'0.85rem'}}>(optional)</span></label>
              <div className="chapters-section__actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setUseRichEditor((v) => !v)}
                >
                  {useRichEditor ? 'Switch to Plain Text' : 'Switch to Rich Editor'}
                </button>
                <label className="btn btn-secondary file-upload-btn" htmlFor="word-upload-input">
                  {isImporting ? 'Importing…' : 'Import .docx'}
                </label>
                <input
                  id="word-upload-input"
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleImportWordFile}
                  className="file-upload-input"
                  disabled={isImporting}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleExportWordFile}
                  disabled={isExporting || isImporting}
                >
                  {isExporting ? 'Exporting…' : 'Export .docx'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleAddChapter}>
                  + Add Chapter
                </button>
              </div>
            </div>

            <p className="form-hint">
              Import supports <strong>.docx</strong> and auto-splits chapters by Heading / BAB title patterns.
            </p>

            {importError && <span className="error-msg">{importError}</span>}

            {errors.chapters && <span className="error-msg">{errors.chapters}</span>}

            <div className="chapters-list">
              {form.chapters.map((chapter, chapterIndex) => {
                const chapterError = errors.chapterItems?.[chapterIndex] || {};

                return (
                  <div key={chapter.id} className="chapter-card">
                    <div className="chapter-card__header">
                      <h3>Chapter {chapterIndex + 1}</h3>
                      <div className="chapter-card__controls">
                        <button
                          type="button"
                          className="btn btn-icon"
                          title="Move up"
                          onClick={() => handleMoveChapter(chapter.id, 'up')}
                          disabled={chapterIndex === 0}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="btn btn-icon"
                          title="Move down"
                          onClick={() => handleMoveChapter(chapter.id, 'down')}
                          disabled={chapterIndex === form.chapters.length - 1}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveChapter(chapter.id)}
                          disabled={form.chapters.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`chapter-title-${chapter.id}`}>Chapter Title</label>
                      <input
                        id={`chapter-title-${chapter.id}`}
                        type="text"
                        value={chapter.title}
                        onChange={(event) => handleChapterTitleChange(chapter.id, event.target.value)}
                        className={chapterError.title ? 'input-error' : ''}
                        placeholder="Chapter title..."
                      />
                      {chapterError.title && <span className="error-msg">{chapterError.title}</span>}
                    </div>

                    {useRichEditor ? (
                      <div className={`rich-editor${chapterError.content ? ' input-error' : ''}`}>
                        <ReactQuill
                          theme="snow"
                          value={chapter.content}
                          onChange={(value) => handleChapterContentChange(chapter.id, value)}
                          modules={editorModules}
                          formats={editorFormats}
                          placeholder={`Write content for Chapter ${chapterIndex + 1}...`}
                        />
                      </div>
                    ) : (
                      <textarea
                        className={chapterError.content ? 'input-error' : ''}
                        value={getPlainTextFromHtml(chapter.content)}
                        onChange={(e) => handleChapterContentChange(chapter.id, e.target.value)}
                        rows={12}
                        placeholder={`Write content for Chapter ${chapterIndex + 1}...`}
                        style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.95rem', padding: '0.5rem', boxSizing: 'border-box' }}
                      />
                    )}
                    {chapterError.content && <span className="error-msg">{chapterError.content}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="chapters-section" style={{ marginTop: '2rem' }}>
            <div className="chapters-section__header">
              <label>Chapters for Sale</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSellableChapters((prev) => [
                  ...prev,
                  { number: prev.length + 1, title: '', price: 0 },
                ])}
              >
                + Add Chapter
              </button>
            </div>
            <p className="form-hint">Define which chapters customers can purchase individually (used for Per Chapter packages).</p>

            {sellableChapters.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No sellable chapters added yet.</p>
            ) : (
              <div className="admin-table-wrapper" style={{ marginTop: '0.75rem' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Chapter Title</th>
                      <th>Price (Rp)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellableChapters.map((ch, i) => (
                      <tr key={i}>
                        <td style={{ width: '3rem' }}>
                          <input
                            type="number"
                            min="1"
                            value={ch.number}
                            onChange={(e) => setSellableChapters((prev) => prev.map((c, idx) => idx === i ? { ...c, number: parseInt(e.target.value) || 1 } : c))}
                            style={{ width: '3.5rem' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={ch.title}
                            onChange={(e) => setSellableChapters((prev) => prev.map((c, idx) => idx === i ? { ...c, title: e.target.value } : c))}
                            placeholder="e.g. Chapter 1: The Beginning"
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td style={{ width: '8rem' }}>
                          <input
                            type="number"
                            min="0"
                            value={ch.price}
                            onChange={(e) => setSellableChapters((prev) => prev.map((c, idx) => idx === i ? { ...c, price: parseInt(e.target.value) || 0 } : c))}
                            style={{ width: '7rem' }}
                          />
                        </td>
                        <td style={{ width: '3rem' }}>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => setSellableChapters((prev) => prev.filter((_, idx) => idx !== i))}
                          >×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="form-group form-group--checkbox">
            <input id="featured" name="featured" type="checkbox" checked={form.featured} onChange={handleChange} />
            <label htmlFor="featured">Feature this book on the homepage</label>
          </div>

          <div className="editor-form__actions">
            <button type="submit" className="btn btn-primary" disabled={isImporting || isExporting}>
              {isEditing ? 'Save Changes' : 'Add Book'}
            </button>
            <Link to="/admin" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookEditor;
