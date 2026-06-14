import api from './api';

export const resumeService = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('resume', file);
    return api.post('/resume/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  get:    () => api.get('/resume'),
  delete: () => api.delete('/resume'),
};