import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import DOMPurify from 'dompurify';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Eye,
  Edit2
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl);
    
    // cancelled
    if (url === null) return;
    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border-b border-border p-2 flex flex-wrap gap-1 items-center bg-muted/20 rounded-t-md">
      <div className="flex items-center gap-1 border-r pr-2 mr-1">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('underline')}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
      </div>

      <div className="flex items-center gap-1 border-r pr-2 mr-1">
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria-label="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          aria-label="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>
      </div>

      <div className="flex items-center gap-1 border-r pr-2 mr-1">
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'left' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
          aria-label="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'center' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
          aria-label="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'right' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
          aria-label="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>
      </div>

      <div className="flex items-center gap-1 border-r pr-2 mr-1">
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet List"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
      </div>

      <div className="flex items-center gap-1 border-r pr-2 mr-1">
         <Toggle
          size="sm"
          pressed={editor.isActive('link')}
          onPressedChange={setLink}
          aria-label="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Toggle>
      </div>

      <div className="flex items-center gap-2 px-2">
        <input
          type="color"
          onInput={(event) => editor.chain().focus().setColor(event.target.value).run()}
          value={editor.getAttributes('textStyle').color || '#000000'}
          className="h-6 w-6 cursor-pointer border-0 p-0 rounded-md overflow-hidden bg-transparent"
          title="Color del texto"
        />
      </div>
    </div>
  );
};

const RichTextEditor = ({ value, onChange, placeholder = "Escribe aquí...", maxLength = 2000 }) => {
  const [isPreview, setIsPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      })
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none max-w-none min-h-[150px] p-4 text-foreground bg-background',
        placeholder: placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const sanitizedHtml = DOMPurify.sanitize(html);
      onChange(sanitizedHtml);
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      const currentHtml = editor.getHTML();
      if (value && value !== currentHtml && value !== '<p></p>') {
          setTimeout(() => {
            if (editor && !editor.isDestroyed) {
                editor.commands.setContent(value);
            }
          }, 0);
      }
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const characterCount = editor.storage.characterCount.characters();

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-end">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={(e) => { e.preventDefault(); setIsPreview(!isPreview); }}
          className="h-8 text-xs font-medium"
        >
          {isPreview ? (
            <><Edit2 className="w-3.5 h-3.5 mr-2" /> Editar</>
          ) : (
            <><Eye className="w-3.5 h-3.5 mr-2" /> Vista Previa</>
          )}
        </Button>
      </div>

      <div className={cn("flex flex-col border rounded-md shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary transition-colors", isPreview ? "hidden" : "flex")}>
        <MenuBar editor={editor} />
        <EditorContent editor={editor} className="cursor-text" />
        <div className="bg-muted/10 border-t border-border px-3 py-1.5 flex justify-end items-center">
          <span className={cn(
            "text-xs text-muted-foreground",
            characterCount >= maxLength ? "text-destructive font-bold" : ""
          )}>
            {characterCount} / {maxLength} caracteres
          </span>
        </div>
      </div>

      {isPreview && (
        <div 
          className="prose-policies min-h-[150px] p-4 border rounded-md shadow-sm bg-muted/5 overflow-hidden break-words"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value || `<p class="text-muted-foreground italic">Sin contenido</p>`) }}
        />
      )}
    </div>
  );
};

export default RichTextEditor;