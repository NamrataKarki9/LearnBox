import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { invitationAPI, College } from '../../services/api';
import { AlertCircle, Mail, User, Building2 } from 'lucide-react';

interface InviteCollegeAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  colleges: College[];
  onInvitationSent: (invitation: any) => void;
}

export function InviteCollegeAdminModal({
  isOpen,
  onClose,
  colleges,
  onInvitationSent
}: InviteCollegeAdminModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    collegeId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.toLowerCase())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.collegeId) {
      newErrors.collegeId = 'Please select a college';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('Sending invitation with data:', {
        email: formData.email.toLowerCase().trim(),
        name: formData.name.trim(),
        collegeId: parseInt(formData.collegeId)
      });

      const response = await invitationAPI.createInvitation({
        email: formData.email.toLowerCase().trim(),
        name: formData.name.trim(),
        collegeId: parseInt(formData.collegeId)
      });

      console.log('Invitation API response:', response);

      // Handle response - axios returns response object with data property
      const responseData = response.data || response;
      
      if (responseData.success && responseData.invitation) {
        if (responseData.warning) {
          toast.warning(responseData.warning);
        } else {
          toast.success('Invitation successfully sent.');
        }
        onInvitationSent(responseData.invitation);
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          collegeId: ''
        });
        setErrors({});
        onClose();
      } else {
        const errorMessage = responseData.error || responseData.message || 'Failed to send invitation';
        console.error('Invitation failed:', responseData);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error sending invitation (full error):', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to send invitation. Please try again later.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite College Admin</DialogTitle>
          <DialogDescription>
            Send an invitation to register as a College Admin for a college
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) {
                  setErrors({ ...errors, name: '' });
                }
              }}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) {
                  setErrors({ ...errors, email: '' });
                }
              }}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          {/* College Selection */}
          <div className="space-y-2">
            <Label htmlFor="college" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              College *
            </Label>
            <Select value={formData.collegeId} onValueChange={(value) => {
              setFormData({ ...formData, collegeId: value });
              if (errors.collegeId) {
                setErrors({ ...errors, collegeId: '' });
              }
            }}>
              <SelectTrigger id="college" className={errors.collegeId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a college" />
              </SelectTrigger>
              <SelectContent>
                {colleges.map((college) => (
                  <SelectItem key={college.id} value={college.id.toString()}>
                    {college.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.collegeId && <p className="text-sm text-red-500">{errors.collegeId}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#7C9E9E] hover:bg-[#6B8D8D] text-white"
            >
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
