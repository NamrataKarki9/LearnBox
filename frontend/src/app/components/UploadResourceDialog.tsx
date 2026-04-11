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
import { toast } from 'sonner';
import { P, adminSelectStyle } from '../../constants/theme';

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
  const selectTriggerStyle: React.CSSProperties = {
    ...adminSelectStyle,
    width: '100%',
    height: 40,
    border: `1px solid ${P.sand}`,
    backgroundColor: P.parchmentLight,
    color: P.ink,
    boxShadow: `inset 0 0 0 1px ${P.sandLight}`,
    fontFamily: "'Lora', Georgia, serif",
    fontSize: 13.5
  };
  const selectContentStyle: React.CSSProperties = {
    background: P.parchmentLight,
    border: `1px solid ${P.sand}`,
    boxShadow: `0 14px 30px rgba(28,18,8,0.12), inset 0 0 0 1px ${P.sandLight}`,
    color: P.ink
  };
  const selectItemStyle: React.CSSProperties = {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: 13.5,
    color: P.ink
  };

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

  // Fetch faculties when dialog opens
  useEffect(() => {
    if (open) {
      fetchFaculties();
    }
  }, [open]);

  // Validation functions
  const validateTitle = (value: string): string => {
    if (!value.trim()) {
      return 'Title is required';
    }
    if (value.trim().length < 3) {
      return 'Title must be at least 3 characters';
    }
    return '';
  };

  const validateFaculty = (value: string): string => {
    if (!value) {
      return 'Faculty is required';
    }
    return '';
  };

  const validateYear = (value: string): string => {
    if (!value) {
      return 'Academic year is required';
    }
    return '';
  };

  const validateModule = (value: string): string => {
    if (!formData.facultyId || !formData.year) {
      return 'Select faculty and year first';
    }
    if (!value) {
      return 'Module is required';
    }
    if (modules.length === 0) {
      return 'No modules available for this selection';
    }
    return '';
  };

  const validateFile = (selectedFile: File | null): string => {
    if (!selectedFile) {
      return 'Please select a file to upload';
    }
    
    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      return 'Invalid file type. Only PDF, DOC, DOCX, PPT, and PPTX are allowed.';
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB.';
    }
    
    return '';
  };

  // Check if all fields are valid
  const isFormValid = (): boolean => {
    const titleError = validateTitle(formData.title);
    const facultyError = validateFaculty(formData.facultyId);
    const yearError = validateYear(formData.year);
    const moduleError = validateModule(formData.moduleId);
    const fileError = validateFile(file);
    
    return !titleError && !facultyError && !yearError && !moduleError && !fileError;
  };

  // Fetch modules when faculty and year are selected
  useEffect(() => {
    if (formData.facultyId && formData.year) {
      fetchModules(parseInt(formData.facultyId), parseInt(formData.year));
    } else {
      setModules([]);
    }
  }, [formData.facultyId, formData.year]);

  const fetchModules = async (facultyId: number, year: number) => {
    try {
      const response = await moduleAPI.getByFacultyAndYear(facultyId, year);
      setModules(response.data.data || []);
    } catch (err) {
      console.error('Error fetching modules:', err);
      setModules([]);
    }
  };

  const fetchFaculties = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      const user = sessionStorage.getItem('user');
      console.log('Auth Token exists:', !!token);
      console.log('User from sessionStorage:', user ? JSON.parse(user) : null);
      
      const response = await facultyAPI.getAll();
      setFaculties(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching faculties:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = err.response?.data?.error || 'Failed to load faculties';
      
      if (err.response?.data?.userRole && err.response?.data?.requiredRoles) {
        errorMessage += `\n(Your role: ${err.response.data.userRole}, Required: ${err.response.data.requiredRoles.join(' or ')})`;
      }
      
      toast.error(errorMessage);
      setFaculties([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const titleError = validateTitle(formData.title);
    const facultyError = validateFaculty(formData.facultyId);
    const yearError = validateYear(formData.year);
    const moduleError = validateModule(formData.moduleId);
    const fileError = validateFile(file);
    
    // Collect all errors
    const errors = [];
    if (titleError) errors.push(titleError);
    if (facultyError) errors.push(facultyError);
    if (yearError) errors.push(yearError);
    if (moduleError) errors.push(moduleError);
    if (fileError) errors.push(fileError);
    
    // If any errors exist, show them in a toast and don't submit
    if (errors.length > 0) {
      toast.error(errors.join('\n'));
      return;
    }
    
    setLoading(true);
    
    // Show info message for large files
    if (file && file.size > 5 * 1024 * 1024) { // > 5MB
      console.log('⏳ Uploading large file... This may take several minutes.');
    }
    
    try {
      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('file', file!);
      uploadData.append('title', formData.title);
      uploadData.append('facultyId', formData.facultyId);
      uploadData.append('year', formData.year);
      uploadData.append('moduleId', formData.moduleId);
      
      if (formData.description) {
        uploadData.append('description', formData.description);
      }
      
      const response = await resourceAPI.upload(uploadData);
      
      // Clear form and file immediately
      setFormData({ title: '', description: '', facultyId: '', year: '', moduleId: '' });
      setFile(null);
      
      // Call onSuccess() which refreshes data, then close
      // This ensures we start the fetch process immediately after server response
      onSuccess();
      onClose();
      
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to upload resource';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ title: '', description: '', facultyId: '', year: '', moduleId: '' });
      setFile(null);
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
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter resource title"
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
              onValueChange={(value) => {
                setFormData({ ...formData, facultyId: value, year: '', moduleId: '' });
                setModules([]);
              }}
              disabled={loading}
            >
              <SelectTrigger style={selectTriggerStyle}>
                <SelectValue placeholder="Select faculty" />
              </SelectTrigger>
              <SelectContent style={selectContentStyle}>
                {faculties.map((faculty) => (
                  <SelectItem key={faculty.id} value={faculty.id.toString()} style={selectItemStyle}>
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
              onValueChange={(value) => {
                setFormData({ ...formData, year: value, moduleId: '' });
              }}
              disabled={loading || !formData.facultyId}
            >
              <SelectTrigger style={selectTriggerStyle}>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent style={selectContentStyle}>
                <SelectItem value="1" style={selectItemStyle}>Year 1</SelectItem>
                <SelectItem value="2" style={selectItemStyle}>Year 2</SelectItem>
                <SelectItem value="3" style={selectItemStyle}>Year 3</SelectItem>
                <SelectItem value="4" style={selectItemStyle}>Year 4</SelectItem>
              </SelectContent>
            </Select>
            {!formData.facultyId && (
              <p className="text-xs text-gray-500 mt-1">Select faculty first</p>
            )}
          </div>
          
          {/* Module */}
          <div>
            <Label htmlFor="module">Module *</Label>
            <Select
              value={formData.moduleId}
              onValueChange={(value) => setFormData({ ...formData, moduleId: value })}
              disabled={loading || !formData.facultyId || !formData.year || modules.length === 0}
            >
              <SelectTrigger style={selectTriggerStyle}>
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent style={selectContentStyle}>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id.toString()} style={selectItemStyle}>
                    {module.code} - {module.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.facultyId || !formData.year ? (
              <p className="text-xs text-gray-500 mt-1">Select faculty and year first</p>
            ) : modules.length === 0 && formData.facultyId && formData.year ? (
              <p className="text-xs text-amber-600 mt-1">No modules available for this faculty and year</p>
            ) : null}
          </div>
          
          {/* File Upload */}
          <div>
            <Label htmlFor="file">File *</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx"
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
              style={{ backgroundColor: 'var(--color-vermillion)', color: 'white' }}
              className="hover:opacity-90"
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
