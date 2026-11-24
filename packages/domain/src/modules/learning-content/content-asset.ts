import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const ContentAssetId = Uuid.pipe(Schema.brand('ContentAssetId'))

export type ContentAssetId = typeof ContentAssetId.Type

export const pngMediaType = 'image/png'
export const jpegMediaType = 'image/jpeg'
export const webpMediaType = 'image/webp'
export const imageMediaTypes = [pngMediaType, jpegMediaType, webpMediaType] as const
export const pdfMediaType = 'application/pdf'
export const contentAssetMediaTypes = [...imageMediaTypes, pdfMediaType] as const

export const ImageMediaType = Schema.Literals(imageMediaTypes)

export type ImageMediaType = typeof ImageMediaType.Type

export const ContentAssetMediaType = Schema.Literals(contentAssetMediaTypes)

export type ContentAssetMediaType = typeof ContentAssetMediaType.Type

export const ImageDimension = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('ImageDimension'),
)

export type ImageDimension = typeof ImageDimension.Type

export const ByteSize = Schema.Int.check(Schema.isGreaterThan(0)).pipe(Schema.brand('ByteSize'))

export type ByteSize = typeof ByteSize.Type
