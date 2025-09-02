/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import socket from './socket';

/* Actions */

const getProjects = (headers) => socket.get('/projects', undefined, headers);

const getTemplates = (headers) => socket.get('/projects/templates', undefined, headers);

const createProject = (data, headers) => socket.post('/projects', data, headers);

const createProjectFromTemplate = (templateId, data, headers) =>
  socket.post(`/projects/from-template/${templateId}`, data, headers);

const duplicateProject = (id, headers) => socket.post('/projects/duplicate', { id }, headers);

const getProject = (id, headers) => socket.get(`/projects/${id}`, undefined, headers);

const updateProject = (id, data, headers) => socket.patch(`/projects/${id}`, data, headers);

const deleteProject = (id, headers) => socket.delete(`/projects/${id}`, undefined, headers);

export default {
  getProjects,
  getTemplates,
  createProject,
  createProjectFromTemplate,
  getProject,
  updateProject,
  deleteProject,
  duplicateProject,
};
