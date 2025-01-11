"use client"

import * as React from "react"
import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface DocumentViewerProps {
  url: string
  filename: string
  isOpen: boolean
  onClose: () => void
}

export function DocumentViewer({ url, filename, isOpen, onClose }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[80vw] overflow-hidden">
        <SheetHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">{filename}</SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {pageNumber} of {numPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                disabled={pageNumber >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setScale(scale => Math.max(0.5, scale - 0.1))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-16 text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setScale(scale => Math.min(2, scale + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          <div className="flex justify-center">
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center h-32">
                  <div className="animate-pulse text-muted-foreground">Loading document...</div>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                loading={
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-pulse text-muted-foreground">Loading page...</div>
                  </div>
                }
              />
            </Document>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
} 