import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, Code } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * RichTextEditor - Notion-style rich text editor built with Tiptap.
 * Supports bold, italic, bullet lists, and code blocks.
 *
 * Controlled component:
 *  - `value`: HTML string representing the current content
 *  - `onChange`: called with the HTML string whenever the content changes
 */
export default function RichTextEditor({ value = '', onChange, className }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  // Sync external value changes (e.g. when switching between tasks)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  if (!editor) return null

  const tools = [
    {
      name: 'Bold',
      icon: Bold,
      active: () => editor.isActive('bold'),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      name: 'Italic',
      icon: Italic,
      active: () => editor.isActive('italic'),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      name: 'Bullet List',
      icon: List,
      active: () => editor.isActive('bulletList'),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      name: 'Code Block',
      icon: Code,
      active: () => editor.isActive('codeBlock'),
      action: () => editor.chain().focus().toggleCodeBlock().run(),
    },
  ]

  return (
    <div
      className={cn(
        'rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 overflow-hidden',
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-white/30 dark:border-white/20">
        {tools.map((tool) => (
          <button
            key={tool.name}
            type="button"
            title={tool.name}
            onMouseDown={(e) => e.preventDefault()}
            onClick={tool.action}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              tool.active()
                ? 'bg-neon-purple/20 text-neon-purple dark:text-neon-cyan'
                : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10'
            )}
          >
            <tool.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="rich-text-editor prose-sm min-h-[120px] px-3 py-2 text-slate-800 dark:text-slate-200"
      />
    </div>
  )
}

