import type { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import {
  bothExamAccess,
  oralExamAccess,
  writtenExamAccess,
  type ExamAccessScope,
} from '@inzpro/domain/modules/preparation/exam-access'
import {
  constructionQualificationKindCode,
  designQualificationKindCode,
  combinedQualificationKindCode,
  type QualificationKindCode,
} from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import {
  unrestrictedQualificationScopeCode,
  restrictedQualificationScopeCode,
  type QualificationScopeCode,
} from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import {
  architecturalSpecializationCode,
  structuralSpecializationCode,
  roadSpecializationCode,
  bridgeSpecializationCode,
  railwayStructuresSpecializationCode,
  railwayControlSpecializationCode,
  hydrotechnicalSpecializationCode,
  demolitionSpecializationCode,
  electricalSpecializationCode,
  sanitarySpecializationCode,
  telecommunicationsSpecializationCode,
  type SpecializationCode,
} from '@inzpro/domain/modules/qualification-paths/specialization'
import { getWarsawMonth } from '@inzpro/utils/date'
import {
  Landmark,
  Home,
  Zap,
  Droplet,
  Wifi,
  Construction,
  Waves,
  Train,
  Container,
  Hammer,
  HardHat,
  PencilRuler,
  Layers3,
  ShieldCheck,
  Shield,
  FileText,
  Mic2,
  BookOpen,
  Flower,
  Leaf,
} from 'lucide-react'

const specialtyIcons = {
  [architecturalSpecializationCode]: Landmark,
  [structuralSpecializationCode]: Home,
  [roadSpecializationCode]: Construction,
  [bridgeSpecializationCode]: Container,
  [railwayStructuresSpecializationCode]: Train,
  [railwayControlSpecializationCode]: Train,
  [hydrotechnicalSpecializationCode]: Waves,
  [demolitionSpecializationCode]: Hammer,
  [electricalSpecializationCode]: Zap,
  [sanitarySpecializationCode]: Droplet,
  [telecommunicationsSpecializationCode]: Wifi,
}

const kindIcons = {
  [constructionQualificationKindCode]: HardHat,
  [designQualificationKindCode]: PencilRuler,
  [combinedQualificationKindCode]: Layers3,
}

const scopeIcons = {
  [unrestrictedQualificationScopeCode]: ShieldCheck,
  [restrictedQualificationScopeCode]: Shield,
}

const examIcons = {
  [writtenExamAccess]: FileText,
  [oralExamAccess]: Mic2,
  [bothExamAccess]: BookOpen,
}

export const getSpecialtyIcon = (code: SpecializationCode) => specialtyIcons[code]

export const getQualificationKindIcon = (code: QualificationKindCode) => kindIcons[code]

export const getScopeIcon = (code: QualificationScopeCode) => scopeIcons[code]

export const getExamTypeIcon = (scope: ExamAccessScope) => examIcons[scope]

export const getExamCycleIcon = (date: UtcIsoDateTime) =>
  getWarsawMonth(date) <= 7 ? Flower : Leaf
