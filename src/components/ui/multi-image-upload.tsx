import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { uploadApi } from '@/api/upload'

type MultiImageUploadProps = {
  values: string[]
  onChange: (urls: string[]) => void
  max?: number
  label?: string
  description?: string
  folder?: string
  disabled?: boolean
}

export function MultiImageUpload({
  values,
  onChange,
  max = 3,
  label,
  description,
  folder = 'jobs/photos',
  disabled = false,
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const remaining = Math.max(0, max - values.length)

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || remaining <= 0) return

    setError('')
    setUploading(true)

    try {
      const toUpload = files.slice(0, remaining)
      const urls: string[] = []

      for (const file of toUpload) {
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
          setError('Only JPEG, PNG, and WebP images are allowed')
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          setError('Each image must be under 5MB')
          continue
        }
        const result = await uploadApi.uploadImage(file, folder)
        urls.push(result.url)
      }

      if (urls.length) {
        onChange([...values, ...urls].slice(0, max))
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeAt = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-medium">{label}</p>}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {values.map((url, index) => (
          <div key={`${url}-${index}`} className="relative aspect-square rounded-md border overflow-hidden bg-form-field">
            <img src={url} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute top-1 right-1 rounded-full bg-black/70 text-white p-1"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {remaining > 0 && !disabled && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-md border border-dashed bg-form-field flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-muted/40"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span className="text-[10px]">Add photo</span>
              </>
            )}
          </button>
        )}

        {values.length === 0 && disabled && (
          <div className="col-span-3 flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
            <ImageIcon className="h-4 w-4" />
            No photos
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {values.length}/{max} photos{remaining > 0 ? ` · ${remaining} remaining` : ''}
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleSelect}
        disabled={disabled || uploading || remaining <= 0}
      />

      {remaining > 0 && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload photos
            </>
          )}
        </Button>
      )}
    </div>
  )
}
