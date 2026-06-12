'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useEffect, useCallback } from 'react';
import styles from '../admin.module.css';

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

type Level = 1 | 2 | 3;

function ToolbarBtn({
  active, onClick, title, children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`${styles.tipTapBtn} ${active ? styles.tipTapBtnActive : ''}`}
    >
      {children}
    </button>
  );
}

export function TipTapEditor({ content, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener' } }),
      Placeholder.configure({ placeholder: placeholder ?? '내용을 입력하세요...' }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    editorProps: {
      attributes: { class: styles.tipTapEditor },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  // content prop 외부에서 바뀔 때 sync (edit 모드 열 때)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  const addImage = useCallback(() => {
    const url = window.prompt('이미지 URL 입력');
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const setLink = useCallback(() => {
    const prev = editor?.getAttributes('link').href ?? '';
    const url = window.prompt('링크 URL 입력', prev);
    if (url === null) return;
    if (url === '') { editor?.chain().focus().unsetLink().run(); return; }
    editor?.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={styles.tipTapWrapper}>
      <div className={styles.tipTapToolbar}>
        {/* 제목 */}
        {([1, 2, 3] as Level[]).map((lvl) => (
          <ToolbarBtn
            key={lvl}
            active={editor.isActive('heading', { level: lvl })}
            onClick={() => editor.chain().focus().toggleHeading({ level: lvl }).run()}
            title={`제목 ${lvl}`}
          >
            H{lvl}
          </ToolbarBtn>
        ))}

        <span className={styles.tipTapSeparator} />

        {/* 텍스트 스타일 */}
        <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="굵게">
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="기울임">
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="밑줄">
          <u>U</u>
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="코드">
          {'</>'}
        </ToolbarBtn>

        <span className={styles.tipTapSeparator} />

        {/* 목록 */}
        <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="불릿 목록">
          •≡
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="번호 목록">
          1≡
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="인용">
          ❝
        </ToolbarBtn>

        <span className={styles.tipTapSeparator} />

        {/* 삽입 */}
        <ToolbarBtn active={editor.isActive('link')} onClick={setLink} title="링크">
          🔗
        </ToolbarBtn>
        <ToolbarBtn active={false} onClick={addImage} title="이미지 URL">
          🖼
        </ToolbarBtn>
        <ToolbarBtn active={false} onClick={addTable} title="표 삽입">
          ⊞
        </ToolbarBtn>

        <span className={styles.tipTapSeparator} />

        {/* 되돌리기 */}
        <ToolbarBtn active={false} onClick={() => editor.chain().focus().undo().run()} title="실행 취소">
          ↩
        </ToolbarBtn>
        <ToolbarBtn active={false} onClick={() => editor.chain().focus().redo().run()} title="다시 실행">
          ↪
        </ToolbarBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
