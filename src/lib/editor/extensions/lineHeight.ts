import { Extension } from '@tiptap/core';
import { lineSpacingDeclarations } from '../../styles/styleSheet';

// A line spacing is proportional to the font's natural line height, not to the font
// size like CSS unitless line-height. The factor rides as a variable editor.css
// multiplies by the block's own natural line height (blockFontSize.ts).

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

export const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading'] as string[],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.getAttribute('data-line-height') || null,
            // A factor editor.css multiplies by the block's font's natural line height,
            // which is what a proportional spacing is proportional to — or a fixed height.
            renderHTML: (attributes: Record<string, unknown>) => {
              if (!attributes.lineHeight) return {};
              const raw = String(attributes.lineHeight);
              return {
                'data-line-height': raw,
                style: lineSpacingDeclarations(raw).join('; '),
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ commands }) => {
        return this.options.types
          .map((type) => commands.updateAttributes(type, { lineHeight }))
          .some((r) => r);
      },
      unsetLineHeight: () => ({ commands }) => {
        return this.options.types
          .map((type) => commands.resetAttributes(type, 'lineHeight'))
          .some((r) => r);
      },
    };
  },
});
