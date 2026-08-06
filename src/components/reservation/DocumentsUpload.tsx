import { useState } from 'react'
import { useReservationForm } from '@/context/ReservationContext'
import Dropzone, { type FileKey } from './Dropzone'

interface DocumentsUploadProps {
  stepNumber?: number
}

export default function DocumentsUpload({ stepNumber = 3 }: DocumentsUploadProps) {
  const { form, updateFile } = useReservationForm()
  const [dragOverId, setDragOverId] = useState<FileKey | null>(null)

  return (
    <div className="rounded-[10px] border border-border bg-card p-7">
      <h2 className="mb-5 flex items-center gap-2.5 text-[15px] font-semibold tracking-[1.5px] text-primary">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{stepNumber}</span>
        Documents à joindre
      </h2>

      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permis de conduire</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Dropzone id="permisRecto" label="Recto" hint="JPG, PNG ou PDF · 10 Mo max"
          file={form.files.permisRecto} isDragOver={dragOverId === 'permisRecto'}
          onFileChange={updateFile} onDragOver={setDragOverId} onDragLeave={() => setDragOverId(null)} />
        <Dropzone id="permisVerso" label="Verso" hint="JPG, PNG ou PDF · 10 Mo max"
          file={form.files.permisVerso} isDragOver={dragOverId === 'permisVerso'}
          onFileChange={updateFile} onDragOver={setDragOverId} onDragLeave={() => setDragOverId(null)} />
      </div>

      <p className="mb-2.5 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Carte d'identité</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Dropzone id="cniRecto" label="Recto" hint="JPG, PNG ou PDF · 10 Mo max"
          file={form.files.cniRecto} isDragOver={dragOverId === 'cniRecto'}
          onFileChange={updateFile} onDragOver={setDragOverId} onDragLeave={() => setDragOverId(null)} />
        <Dropzone id="cniVerso" label="Verso" hint="JPG, PNG ou PDF · 10 Mo max"
          file={form.files.cniVerso} isDragOver={dragOverId === 'cniVerso'}
          onFileChange={updateFile} onDragOver={setDragOverId} onDragLeave={() => setDragOverId(null)} />
      </div>

      <p className="mb-2.5 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Justificatif de domicile</p>
      <Dropzone id="justificatif" label="Facture récente (- de 3 mois)" hint="EDF, téléphone, box internet... · JPG, PNG ou PDF"
        file={form.files.justificatif} isDragOver={dragOverId === 'justificatif'}
        onFileChange={updateFile} onDragOver={setDragOverId} onDragLeave={() => setDragOverId(null)} />
    </div>
  )
}