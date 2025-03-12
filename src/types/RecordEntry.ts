export interface BaseEditEntry {
  timestamp: number
  moderator: string
}

export interface EditEntryGeneric extends BaseEditEntry {
  change: `moderator` | `url` | `reason`
  newValue: string
}

export interface EditEntryRelated extends BaseEditEntry {
  change: `related`
  newValue: number[]
}

export type RecordEntry = {
  timestamp: number,
  moderator: string,
  user: string,
  action: `note` | `warning` | `mute` | `kick` | `ban` | `other`,
  reason: string,
  url: string | null,
  relatedCases: number[],
  edits: EditEntryGeneric[] | EditEntryRelated[]
};