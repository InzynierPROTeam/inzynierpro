import { richContentNodeFixtures, unsupportedNodeFixture } from '@inzpro/rich-content/fixtures'
import { paragraphs } from '@inzpro/rich-content/rich-content'
import { expect, test } from 'vitest'
import { LearningContentWriteError } from '~api/modules/learning-content/application/errors.js'
import { UnknownContentAsset } from '~api/modules/learning-content/domain/errors.js'
import {
  addFixtureAsset,
  addFixtureOralCategory,
  addFixtureOralQuestion,
  editFixtureOralDraft,
  withdrawFixtureOralRevision,
  addFixtureQuestion,
  createStudyFixture,
  publishFixtureRevision,
} from '~api/test/learning-fixtures.js'

test('a question with an explanation of every node, including an image of a stored asset, is saved', async () => {
  const { pathId, documentId } = await createStudyFixture()
  const assetId = await addFixtureAsset()
  const { image: _storedElsewhere, ...nodesWithoutImage } = richContentNodeFixtures

  const content = {
    version: 1,
    doc: {
      type: 'doc',
      content: [
        ...Object.values(nodesWithoutImage).flatMap(
          (fixture): ReadonlyArray<unknown> => fixture.doc.content,
        ),
        { type: 'image', attrs: { assetId, alt: 'Rysunek', caption: 'Rys. 1' } },
      ],
    },
  } as const

  await expect(addFixtureQuestion(pathId, documentId, true, content)).resolves.toMatchObject({
    explanation: content,
  })
})

test('an explanation with an unknown node is rejected on write', async () => {
  const { pathId, documentId } = await createStudyFixture()

  await expect(
    addFixtureQuestion(pathId, documentId, true, unsupportedNodeFixture),
  ).rejects.toThrow()
})

test('an image of an asset that was never stored is rejected on write', async () => {
  const { pathId, documentId } = await createStudyFixture()
  const question = await addFixtureQuestion(pathId, documentId, true, paragraphs('Wyjaśnienie'))

  await expect(
    addFixtureQuestion(pathId, documentId, true, richContentNodeFixtures.image),
  ).rejects.toBeInstanceOf(UnknownContentAsset)
  await expect(
    publishFixtureRevision(question.id, 'substantive', richContentNodeFixtures.image),
  ).rejects.toBeInstanceOf(UnknownContentAsset)
})

test('an oral draft stays editable until it is published', async () => {
  const { pathId } = await createStudyFixture()
  const category = await addFixtureOralCategory()
  const draft = await addFixtureOralQuestion(pathId, category, 1, false)

  await expect(editFixtureOralDraft(draft.revisionId)).resolves.toBeUndefined()
})

test('a published oral revision rejects edits, also after withdrawal', async () => {
  const { pathId } = await createStudyFixture()
  const category = await addFixtureOralCategory()
  const question = await addFixtureOralQuestion(pathId, category, 1)

  await expect(editFixtureOralDraft(question.revisionId)).rejects.toBeInstanceOf(
    LearningContentWriteError,
  )

  await withdrawFixtureOralRevision(question.revisionId)

  await expect(editFixtureOralDraft(question.revisionId)).rejects.toBeInstanceOf(
    LearningContentWriteError,
  )
})

test('repeating an oral withdrawal is safe', async () => {
  const { pathId } = await createStudyFixture()
  const category = await addFixtureOralCategory()
  const question = await addFixtureOralQuestion(pathId, category, 1)

  await withdrawFixtureOralRevision(question.revisionId, 'Pierwszy powód')

  await expect(
    withdrawFixtureOralRevision(question.revisionId, 'Drugi powód'),
  ).resolves.toBeUndefined()
})

test('an oral answer with an image of an asset that was never stored is rejected on write', async () => {
  const { pathId } = await createStudyFixture()
  const category = await addFixtureOralCategory()

  await expect(
    addFixtureOralQuestion(pathId, category, 1, true, richContentNodeFixtures.image),
  ).rejects.toBeInstanceOf(UnknownContentAsset)
})
