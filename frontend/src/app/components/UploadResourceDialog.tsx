/**
 * Upload Resource Dialog Component
 * Allows admins to upload PDF resources to Cloudinary
 */

import { useState, useEffect } from 'react';
import { resourceAPI, moduleAPI, facultyAPI } from '../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';

interface Module {
  id: number;
  name: string;
  code: string;
}

interface Faculty {
  id: number;
  name: string;
  code: string;
}

interface UploadResourceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadResourceDialog({ open, onClose, onSuccess }: UploadResourceDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    facultyId: '',
    year: '',
    moduleId: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch modules and faculties when dialog opens
  useEffect(() => {
    if (open) {
      fetchModules();
      fetchFaculties();
    }
  }, [open]);

  const fetchModules = async () => {
    try {
      const response = await moduleAPI.getAll();
      setModules(response.data.data || []);
    } catch (err) {
      console.error('Error fetching modules:', err);
      setModules([]);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await facultyAPI.getAll();
      setFaculties(response.data.data || []);
    } catch (err) {
      console.error('Error fetching faculties:', err);
      setFaculties([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Only PDF, DOC, DOCX, PPT, and PPTX files are allowed.');
        return;
      }
      
      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB.');
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation - all fields mandatory except description
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.facultyId) {
      setError('Faculty is required');
      return;
    }
    
    if (!formData.year) {
      setError('Academic year is required');
      return;
    }
    
    if (!formData.moduleId) {
      setError('Module is required');
      return;
    }
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('title', formData.title);
      uploadData.append('facultyId', formData.facultyId);
      uploadData.append('year', formData.year);
      uploadData.append('moduleId', formData.moduleId);
      
      if (formData.description) {
        uploadData.append('description', formData.description);
      }
      
      const response = await resourceAPI.upload(uploadData);
      
      setSuccess('Resource uploaded successfully!');
      
      // Reset form
      setTimeout(() => {
        setFormData({ title: '', description: '', facultyId: '', year: '', moduleId: '' });
        setFile(null);
        setSuccess('');
        onSuccess();
        onClose();
      }, 1500);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to upload resource';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ title: '', description: '', facultyId: '', year: '', moduleId: '' });
      setFile(null);
      setError('');
      setSuccess('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Upload New Resource</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter resource title"
              required
              disabled={loading}
            />
          </div>
          
          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter resource description (optional)"
              rows={3}
              disabled={loading}
            />
          </div>
          
          {/* Faculty */}
          <div>
            <Label htmlFor="faculty">Faculty *</Label>
            <Select
              value={formData.facultyId}
              onValueChange={(value) => setFormData({ ...formData, facultyId: value })}
              disabled={loading}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select faculty" />
              </SelectTrigger>
              <SelectContent>
                {faculties.map((faculty) => (
                  <SelectItem key={faculty.id} value={faculty.id.toString()}>
                    {faculty.code} - {faculty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Year */}
          <div>
            <Label htmlFor="year">Academic Year *</Label>
            <Select
              value={formData.year}
              onValueChange={(value) => setFormData({ ...formData, year: value })}
              disabled={loading}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Year 1</SelectItem>
                <SelectItem value="2">Year 2</SelectItem>
                <SelectItem value="3">Year 3</SelectItem>
                <SelectItem value="4">Year 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Module */}
          <div>
            <Label htmlFor="module">Module *</Label>
            <Select
              value={formData.moduleId}
              onValueChange={(value) => setFormData({ ...formData, moduleId: value })}
              disabled={loading}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id.toString()}>
                    {module.code} - {module.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* File Upload */}
          <div>
            <Label htmlFor="file">File *</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Allowed: PDF, DOC, DOCX, PPT, PPTX (Max 10MB)
            </p>
            {file && (
              <p className="text-sm text-green-600 mt-1">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          
          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload Resource'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
