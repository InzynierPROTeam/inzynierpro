import { Option, Schema } from 'effect'

const unitKinds = {
  cz: { label: 'cz.', children: ['rozdz'] },
  rozdz: { label: 'rozdz.', children: [] },
  art: { label: 'art.', children: ['ust', 'pkt'] },
  par: { label: '§', children: ['ust', 'pkt'] },
  ust: { label: 'ust.', children: ['pkt'] },
  pkt: { label: 'pkt', children: ['lit'] },
  lit: { label: 'lit.', children: [] },
  tab: { label: 'tab.', children: [] },
  zal: { label: 'zał. nr', children: ['par', 'pkt', 'tab'] },
} as const satisfies Record<
  string,
  { readonly label: string; readonly children: ReadonlyArray<string> }
>

type UnitKind = keyof typeof unitKinds

const topLevelKinds: ReadonlyArray<UnitKind> = ['cz', 'rozdz', 'art', 'par', 'tab', 'zal']

const isUnitKind = (kind: string): kind is UnitKind => Object.hasOwn(unitKinds, kind)

const unitNumber = /^[1-9][0-9]*[a-z]{0,3}$/
const letterDesignation = /^[a-z]{1,3}$/

const isUnitDesignation = (kind: UnitKind, designation: string) =>
  (kind === 'lit' ? letterDesignation : unitNumber).test(designation)

type Segment = { readonly kind: UnitKind; readonly designation: string }

const segmentsOf = (address: string): Option.Option<ReadonlyArray<Segment>> => {
  const segments: Array<Segment> = []
  let allowedKinds: ReadonlyArray<string> = topLevelKinds

  for (const part of address.split('/')) {
    const [kind, designation, ...rest] = part.split(':')

    if (
      kind === undefined ||
      designation === undefined ||
      rest.length > 0 ||
      !isUnitKind(kind) ||
      !allowedKinds.includes(kind) ||
      !isUnitDesignation(kind, designation)
    ) {
      return Option.none()
    }

    segments.push({ kind, designation })
    allowedKinds = unitKinds[kind].children
  }

  return Option.some(segments)
}

export const DocumentSectionAddress = Schema.String.check(
  Schema.makeFilter((address: string) => Option.isSome(segmentsOf(address)), {
    message: 'Expected a normalized document section address such as "art:5/ust:1/pkt:2"',
  }),
).pipe(Schema.brand('DocumentSectionAddress'))

export type DocumentSectionAddress = typeof DocumentSectionAddress.Type

const segmentLabel = ({ kind, designation }: Segment) => `${unitKinds[kind].label} ${designation}`

export const documentSectionLabel = (address: DocumentSectionAddress) =>
  Option.getOrThrow(segmentsOf(address)).map(segmentLabel).join(' ')

export const documentUnitLabel = (address: DocumentSectionAddress) =>
  Option.getOrThrow(segmentsOf(address)).slice(-1).map(segmentLabel).join(' ')

export const enclosingUnitAddress = (address: DocumentSectionAddress) => {
  const separator = address.lastIndexOf('/')

  return separator === -1
    ? Option.none()
    : Option.some(DocumentSectionAddress.make(address.slice(0, separator)))
}
