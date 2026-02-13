import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

export const getBoards = () => api.get('/boards');
export const createBoard = (data) => api.post('/boards', data);
export const getBoard = (id) => api.get(`/boards/${id}`);
export const createCard = (data) => api.post('/cards', data);
export const updateCard = (id, data) => api.put(`/cards/${id}`, data);
export const createColumn = (boardId, data) => api.post(`/boards/${boardId}/columns`, data);
export const updateColumn = (id, data) => api.put(`/columns/${id}`, data);
export const addMessage = (cardId, data) => api.post(`/cards/${cardId}/messages`, data);
export const addChecklistItem = (cardId, data) => api.post(`/cards/${cardId}/checklist`, data);
export const updateChecklistItem = (itemId, data) => api.put(`/checklist/${itemId}`, data);
export const deleteChecklistItem = (itemId) => api.delete(`/checklist/${itemId}`);
export const analyzeCard = (data) => api.post('/ai/analyze', data);

export default api;
