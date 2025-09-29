"use client"

import { useState } from "react"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from "@/components/ui/button"
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Heading1, 
  Heading2, 
  Heading3,
  ImageIcon,
  Undo,
  Redo
} from 'lucide-react'
import ImageUpload from "./ImageUpload"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function RichTextEditor({ content, onChange, placeholder = "Begin met schrijven..." }: RichTextEditorProps) {
  const [showImageUpload, setShowImageUpload] = useState(false)
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-gray-300 pl-4 italic',
          },
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-sm',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    immediatelyRender: false, // Fix for SSR hydration issues
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] p-4',
      },
    },
  })

  const handleImageSelect = (imageUrl: string) => {
    editor?.chain().focus().setImage({ src: imageUrl }).run()
    setShowImageUpload(false)
  }


  if (!editor) {
    return null
  }

  return (
    <div className="relative">
      <style jsx global>{`
        .ProseMirror h1 {
          font-size: 2rem !important;
          font-weight: bold !important;
          color: #111827 !important;
          margin: 1rem 0 !important;
          line-height: 1.2 !important;
        }
        .ProseMirror h2 {
          font-size: 1.5rem !important;
          font-weight: bold !important;
          color: #111827 !important;
          margin: 0.875rem 0 !important;
          line-height: 1.3 !important;
        }
        .ProseMirror h3 {
          font-size: 1.25rem !important;
          font-weight: bold !important;
          color: #111827 !important;
          margin: 0.75rem 0 !important;
          line-height: 1.4 !important;
        }
        .ProseMirror ul {
          list-style-type: disc !important;
          margin: 0.5rem 0 !important;
          padding-left: 1.5rem !important;
        }
        .ProseMirror ol {
          list-style-type: decimal !important;
          margin: 0.5rem 0 !important;
          padding-left: 1.5rem !important;
        }
        .ProseMirror li {
          margin: 0.25rem 0 !important;
          display: list-item !important;
        }
        .ProseMirror ul li {
          list-style-type: disc !important;
        }
        .ProseMirror ol li {
          list-style-type: decimal !important;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #d1d5db !important;
          background-color: #f9fafb !important;
          padding: 0.5rem 1rem !important;
          margin: 1rem 0 !important;
          border-radius: 0 0.375rem 0.375rem 0 !important;
          font-style: italic !important;
        }
        .ProseMirror strong {
          font-weight: bold !important;
        }
        .ProseMirror em {
          font-style: italic !important;
        }
        .ProseMirror img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
          margin: 1rem 0 !important;
        }
        .ProseMirror p {
          margin: 0.5rem 0 !important;
          line-height: 1.6 !important;
        }
      `}</style>
      <div className="editor-content border border-gray-200 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-gray-200 p-2 bg-gray-50 flex flex-wrap gap-1" onClick={(e) => e.preventDefault()}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().toggleBold().run()
            }}
            className={editor.isActive('bold') ? 'bg-gray-200' : ''}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().toggleItalic().run()
            }}
            className={editor.isActive('italic') ? 'bg-gray-200' : ''}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().toggleBulletList().run()
            }}
            className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().toggleOrderedList().run()
            }}
            className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().toggleBlockquote().run()
            }}
            className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowImageUpload(true)
            }}
            title="Add Image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().undo().run()
            }}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().redo().run()
            }}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor Content */}
        <div className="min-h-[200px]" onClick={(e) => e.preventDefault()}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ImageUpload
            onImageSelect={handleImageSelect}
            onClose={() => setShowImageUpload(false)}
          />
        </div>
      )}
    </div>
  )
}
