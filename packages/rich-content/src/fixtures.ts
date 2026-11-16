import { ContentAssetId } from '@inzpro/domain/modules/learning-content/content-asset'

import type { AnyRichContent, RichContent } from './rich-content.js'

export const fixtureAssetId = ContentAssetId.make('70000000-0000-4000-8000-000000000001')

export const richContentNodeFixtures = {
  paragraph: {
    version: 1,
    doc: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Zwykły, ' },
            { type: 'text', text: 'pogrubiony', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' i ' },
            { type: 'text', text: 'pochylony', marks: [{ type: 'italic' }] },
          ],
        },
      ],
    },
  },
  heading: {
    version: 1,
    doc: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Zakres' }] },
      ],
    },
  },
  bulletList: {
    version: 1,
    doc: {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Inwestor' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Projektant' }] }],
            },
          ],
        },
      ],
    },
  },
  orderedList: {
    version: 1,
    doc: {
      type: 'doc',
      content: [
        {
          type: 'orderedList',
          attrs: { start: 3 },
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Wniosek' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Decyzja' }] }],
            },
          ],
        },
      ],
    },
  },
  blockquote: {
    version: 1,
    doc: {
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Art. 17 Prawa budowlanego' }] },
          ],
        },
      ],
    },
  },
  table: {
    version: 1,
    doc: {
      type: 'doc',
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableHeader',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Budynek' }] }],
                },
                {
                  type: 'tableHeader',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Wysokość' }] }],
                },
              ],
            },
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [
                    { type: 'paragraph', content: [{ type: 'text', text: 'Jednorodzinny' }] },
                  ],
                },
                {
                  type: 'tableCell',
                  attrs: { colspan: 1, rowspan: 1 },
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '0,9 m' }] }],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  image: {
    version: 1,
    doc: {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: {
            assetId: fixtureAssetId,
            alt: 'Przekrój schodów',
            caption: 'Rys. 1. Bieg schodów',
          },
        },
      ],
    },
  },
} as const satisfies Record<string, RichContent>

export const unsupportedNodeFixture = {
  version: 1,
  doc: {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Przed wzorem' }] },
      { type: 'mathBlock', attrs: { latex: 'a^2+b^2=c^2' } },
      { type: 'paragraph', content: [{ type: 'text', text: 'Po wzorze' }] },
    ],
  },
} as const satisfies AnyRichContent
