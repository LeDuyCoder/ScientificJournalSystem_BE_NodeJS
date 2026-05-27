import * as projectService from '../services/project.service.js';

/**
 * Lấy danh sách dự án của người dùng hiện tại
 */
export const getProjects = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const projects = await projectService.getUserProjects(userId);
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách dự án thành công',
      data: projects
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách dự án'
    });
  }
};

/**
 * Lấy chi tiết dự án theo ID
 */
export const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.user_id;

    // Validate ID phải là số nguyên dương
    if (!/^\d+$/.test(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'ID dự án không hợp lệ'
      });
    }

    const project = await projectService.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dự án hoặc bạn không có quyền truy cập dự án này'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết dự án thành công',
      data: project
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy chi tiết dự án'
    });
  }
};

/**
 * Tạo mới một dự án
 */
export const createProject = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { title, subject_area, subject_area_id, subject_category_ids = [], journal_ids = [] } = req.body;
    
    // Hỗ trợ cả hai cách đặt tên trường
    const finalSubjectArea = subject_area !== undefined ? subject_area : subject_area_id;

    // Validate dữ liệu đầu vào
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề dự án không được để trống'
      });
    }

    if (!Array.isArray(subject_category_ids)) {
      return res.status(400).json({
        success: false,
        message: 'subject_category_ids phải là một mảng các ID'
      });
    }

    if (!Array.isArray(journal_ids)) {
      return res.status(400).json({
        success: false,
        message: 'journal_ids phải là một mảng các ID'
      });
    }

    const newProject = await projectService.createProject({
      userId,
      title: title.trim(),
      subject_area: finalSubjectArea,
      subject_category_ids,
      journal_ids
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo dự án thành công',
      data: newProject
    });
  } catch (error) {
    if (error.message && (
      error.message.includes('không tồn tại') || 
      error.message.includes('chưa tồn tại')
    )) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server khi tạo dự án'
    });
  }
};

/**
 * Cập nhật thông tin dự án
 */
export const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.user_id;
    const { title, subject_area, subject_area_id, subject_category_ids, journal_ids } = req.body;

    const finalSubjectArea = subject_area !== undefined ? subject_area : subject_area_id;

    // Validate ID dự án
    if (!/^\d+$/.test(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'ID dự án không hợp lệ'
      });
    }

    // Validate dữ liệu đầu vào
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề dự án không được để trống'
      });
    }

    if (subject_category_ids !== undefined && !Array.isArray(subject_category_ids)) {
      return res.status(400).json({
        success: false,
        message: 'subject_category_ids phải là một mảng các ID'
      });
    }

    if (journal_ids !== undefined && !Array.isArray(journal_ids)) {
      return res.status(400).json({
        success: false,
        message: 'journal_ids phải là một mảng các ID'
      });
    }

    const updated = await projectService.updateProject(projectId, userId, {
      title: title ? title.trim() : undefined,
      subject_area: finalSubjectArea,
      subject_category_ids,
      journal_ids
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dự án hoặc bạn không có quyền truy cập dự án này'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật dự án thành công'
    });
  } catch (error) {
    if (error.message && (
      error.message.includes('không tồn tại') || 
      error.message.includes('chưa tồn tại')
    )) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server khi cập nhật dự án'
    });
  }
};
