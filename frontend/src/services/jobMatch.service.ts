import api from './api';

export const jobMatchService = {
  audit: (data: {
    jobTitle:       string;
    companyName:    string;
    jobDescription: string;
    jobUrl?:        string;
  }) => api.post('/jobmatch', data),

  rewrite:     (id: string) => api.post(`/jobmatch/${id}/rewrite`),
  coverLetter: (id: string) => api.post(`/jobmatch/${id}/cover-letter`),
  getAll:      ()           => api.get('/jobmatch'),
  getById:     (id: string) => api.get(`/jobmatch/${id}`),
  delete:      (id: string) => api.delete(`/jobmatch/${id}`),
};