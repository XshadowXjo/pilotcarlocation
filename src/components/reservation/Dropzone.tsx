import type { ChangeEvent, DragEvent } from 'react'

export type FileKey = 'permisRecto' | 'permisVerso' | 'cniRecto' | 'cniVerso' | 'justificatif'

interface DropzoneProps {
  id: FileKey
  label: string
  hint: string
  file: File | null
  existingPath?: string
  isDragOver: boolean
  onFileChange: (id: FileKey, file: File | null) => void
  onDragOver: (id: FileKey) => void
  onDragLeave: () => void
}

export default function Dropzone({ id, label, hint, file, existingPath, isDragOver, onFileChange, onDragOver, onDragLeave }: DropzoneProps) {
  const isAlreadyProvided = !file && !!existingPath

return (
    <label
      className={`relative block cursor-pointer rounded-lg border-[1.5px] border-dashed bg-[#1a1a1a] p-5 text-center transition-colors hover:border-primary hover:bg-primary/10 ${
        isDragOver ? 'border-primary bg-primary/10' : (file || isAlreadyProvided) ? 'border-primary/60' : 'border-border'
      }`}
      onDragOver={(e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); onDragOver(id) }}
      onDragLeave={onDragLeave}
      onDrop={(e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault()
        onDragLeave()
        if (e.dataTransfer.files[0]) onFileChange(id, e.dataTransfer.files[0])
      }}
    >
      <input
        type="file"
        accept="image/*,.pdf"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e: ChangeEvent<HTMLInputElement>) => onFileChange(id, e.target.files?.[0] ?? null)}
      />
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className={`mx-auto mb-2 h-[26px] w-[26px] ${(file || isAlreadyProvided) ? 'stroke-primary' : 'stroke-muted-foreground'}`}>
        <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
        <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
      </svg>
      <div className="text-[13px] font-semibold tracking-wide text-foreground">{label}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        {isAlreadyProvided ? 'Cliquez pour remplacer' : hint}
      </div>
      <div className="mt-1.5 break-all text-[11px] text-primary">
        {file ? `✓ ${file.name}` : isAlreadyProvided ? '✓ Document déjà fourni' : ''}
      </div>
    </label>
  )
}