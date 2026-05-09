// Copyright (c) 2026 mxrtins04
// https://github.com/mxrtins04
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Conversations
export const getConversations = () => api.get('/conversations');
export const getConversationById = (id) => api.get(`/conversations/${id}`);
export const captureConversation = (data) => api.post('/conversations', data);
export const assignBucket = (id, bucketId) => api.patch(`/conversations/${id}/bucket`, { bucketId });
export const deleteConversation = (id) => api.delete(`/conversations/${id}`);

// Standard Buckets
export const getStandardBuckets = () => api.get('/buckets/standard');
export const createStandardBucket = (data) => api.post('/buckets/standard', data);
export const updateStandardBucket = (id, data) => api.put(`/buckets/standard/${id}`, data);
export const deleteStandardBucket = (id) => api.delete(`/buckets/standard/${id}`);
export const getBucketConversations = (id) => api.get(`/buckets/standard/${id}/conversations`);

// Smart Buckets
export const getSmartBuckets = () => api.get('/buckets/smart');
export const createSmartBucket = (data) => api.post('/buckets/smart', data);
export const updateSmartBucket = (id, data) => api.put(`/buckets/smart/${id}`, data);
export const deleteSmartBucket = (id) => api.delete(`/buckets/smart/${id}`);
export const resolveSmartBucket = (id) => api.get(`/buckets/smart/${id}/resolve`);

// Personal Context
export const getPersonalContext = () => api.get('/context');
export const updatePersonalContext = (data) => api.put('/context', data);

// Generations
export const generatePost = (data) => api.post('/generations', data);
export const getGenerations = () => api.get('/generations');
export const getGenerationById = (id) => api.get(`/generations/${id}`);

export default api;
