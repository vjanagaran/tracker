import Image from "@tiptap/extension-image";

export const NoteImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fileId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-file-id"),
        renderHTML: (attributes) => {
          if (!attributes.fileId) {
            return {};
          }
          return { "data-file-id": attributes.fileId };
        },
      },
    };
  },
}).configure({
  inline: false,
  allowBase64: false,
  resize: false,
  HTMLAttributes: {
    class: "note-image",
  },
});
