'use client';

import { useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, Clock } from "lucide-react";
import { useSearchStore } from "@/lib/store/searchStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

export default function UploadPage() {
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const { isUploading, uploadDocument } = useSearchStore();
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string, size: string, timestamp?: string }[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const { toast } = useToast();

    const handleUpload = async (file: File) => {
        try {
            setUploadProgress(0);
            toast({
                title: "Upload Started",
                description: `Uploading ${file.name}...`,
            });

            // Simulate upload progress
            const interval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 95) {
                        clearInterval(interval);
                        return prev;
                    }
                    return prev + 5;
                });
            }, 100);

            const result = await uploadDocument("1", file);
            clearInterval(interval);
            setUploadProgress(100);

            // Add file to list with timestamp
            setUploadedFiles(prev => [...prev, {
                name: file.name,
                size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                timestamp: new Date().toLocaleString()
            }]);

            toast({
                title: "Upload Complete",
                description: `Successfully uploaded ${file.name}`,
                variant: "default",
            });

            setTimeout(() => {
                setUploadProgress(0);
            }, 1000);
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadProgress(0);
            toast({
                title: "Upload Failed",
                description: error instanceof Error ? error.message : "Failed to upload document",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8 px-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">File Upload</h1>
                    <p className="text-muted-foreground mt-2">
                        Upload your pension plan documents here
                    </p>
                </div>
                <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                    <Button onClick={() => setIsHistoryOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload History
                    </Button>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload History</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-[400px] w-full">
                            <div className="space-y-4">
                                {uploadedFiles.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">
                                        No files have been uploaded yet
                                    </p>
                                ) : (
                                    uploadedFiles.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 rounded-lg border"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <FileText className="h-8 w-8 text-blue-500" />
                                                <div>
                                                    <p className="font-medium">{file.name}</p>
                                                    <div className="flex items-center text-sm text-muted-foreground">
                                                        <span className="mr-4">{file.size}</span>
                                                        {file.timestamp && (
                                                            <span className="flex items-center">
                                                                <Clock className="mr-1 h-3 w-3" />
                                                                {file.timestamp}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Documents</CardTitle>
                        <CardDescription>
                            Drag and drop your files here or click to browse
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FileUpload
                            onUpload={handleUpload}
                            isUploading={isUploading}
                            accept={{
                                'application/pdf': ['.pdf'],
                                'application/msword': ['.doc'],
                                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                            }}
                            className="h-64"
                        />
                        
                        {uploadProgress > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Upload progress</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {uploadedFiles.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Uploads</CardTitle>
                            <CardDescription>
                                Your recently uploaded files
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {uploadedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 rounded-lg border"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <FileText className="h-8 w-8 text-blue-500" />
                                            <div>
                                                <p className="font-medium">{file.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {file.size}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            View
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
} 