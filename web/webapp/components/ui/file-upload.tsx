import * as React from "react"
import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"

interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  onUpload: (file: File) => void
  isUploading?: boolean
  accept?: Record<string, string[]>
}

export function FileUpload({
  onUpload,
  isUploading = false,
  accept = {
    'application/pdf': ['.pdf']
  },
  className,
  ...props
}: FileUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles?.[0]) {
        onUpload(acceptedFiles[0])
      }
    },
    accept,
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed p-6 transition-colors",
        isDragActive
          ? "border-primary/50 bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50",
        className
      )}
      {...props}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center">
        <Icons.upload className="h-10 w-10 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">
          {isDragActive ? (
            "Drop your PDF file here"
          ) : (
            <>
              Drag & drop your PDF file here, or{" "}
              <Button
                variant="link"
                className="h-auto p-0 text-primary"
              >
                choose file
              </Button>
            </>
          )}
        </p>
      </div>
      {isUploading && (
        <div className="mt-4 flex items-center gap-2">
          <Icons.spinner className="h-4 w-4 animate-spin" />
          <p className="text-sm text-muted-foreground">Uploading...</p>
        </div>
      )}
    </div>
  )
} 