import { getErrorResult } from '.';
import appClient from './appClient';

// userService
export async function register(model) {
    try {
        const response = await appClient.post(`/users/register`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function login(model) {
    try {
        const response = await appClient.post(`/users/login`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function logout(model) {
    try {
        const response = await appClient.post(`/users/logout`, model);

        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function getCurrentUser() {
    try {
        const response = await appClient.get(`/users/current`);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function editCurrentUser(model) {
    try {
        const response = await appClient.post(`/users/current/edit`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function getUser(userId) {
    try {
        const response = await appClient.get(`/users/${userId}`);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function getUsers(model) {
    try {
        const response = await appClient.get(`/users`, { params: model });
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function changePassword(model) {
    try {
        const response = await appClient.post(`/users/password/change`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function processPayment(model) {
    try {
        const response = await appClient.post(`/users/payment/process`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function verifyPayment(model) {
    try {
        const response = await appClient.post(`/users/payment/verify`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function sendCode(model) {
    try {
        const response = await appClient.post(`/users/code/send`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function receiveCode(model) {
    try {
        const response = await appClient.post(`/users/code/receive`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function followUser(userId) {
    try {
        const response = await appClient.post(`/users/${userId}/follow`);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function unfollowUser(userId) {
    try {
        const response = await appClient.post(`/users/${userId}/unfollow`);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

// courseService
export async function addCourse(model) {
    try {
        const response = await appClient.post(`/courses/add`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function editCourse(model) {
    try {
        const response = await appClient.post(`/courses/edit`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function deleteCourse(model) {
    try {
        const response = await appClient.post(`/courses/delete`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function reorderCourses(model) {
    try {
        const response = await appClient.post(`/courses/reorder`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function populateCourses(model) {
    try {
        const response = await appClient.get(`/courses/populate`, { params: model });
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function exportCourses(model) {
    try {
        const response = await appClient.post(`/courses/export`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function importCourses(model) {
    try {
        const response = await appClient.post(`/courses/import`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function progressCourse(model) {
    try {
        const response = await appClient.post(`/courses/progress`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

// sectionService
export async function addSection(model) {
    try {
        const response = await appClient.post(`/sections/add`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function editSection(model) {
    try {
        const response = await appClient.post(`/sections/edit`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function deleteSection(model) {
    try {
        const response = await appClient.post(`/sections/delete`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

// lessonService
export async function addLesson(model) {
    try {
        const response = await appClient.post(`/lessons/add`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function editLesson(model) {
    try {
        const response = await appClient.post(`/lessons/edit`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function deleteLesson(model) {
    try {
        const response = await appClient.post(`/lessons/delete`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

// contentService
export async function addContent(model) {
    try {
        const response = await appClient.post(`/contents/add`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function editContent(model) {
    try {
        const response = await appClient.post(`/contents/edit`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function deleteContent(model) {
    try {
        const response = await appClient.post(`/contents/delete`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

// commentService
export async function addComment(model) {
    try {
        const response = await appClient.post(`/comments/add`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function editComment(model) {
    try {
        const response = await appClient.post(`/comments/edit`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function deleteComment(model) {
    try {
        const response = await appClient.post(`/comments/delete`, model);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

export async function getComments(model) {
    try {
        const response = await appClient.get(`/comments`, { params: model });
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}

// assetService
export async function getAsset(assetId) {
    try {
        const response = await appClient.get(`/assets/${assetId}`);
        return response.data;
    } catch (error) {
        return getErrorResult(error);
    }
}