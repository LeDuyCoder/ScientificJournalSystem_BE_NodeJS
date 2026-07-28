import projectMemberService from "../services/projectMember.service.js";

export const getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const members = await projectMemberService.getProjectMembers(projectId);
    res.status(200).json({ code: 200, success: true, message: "Lấy danh sách thành viên thành công", data: members });
  } catch (error) {
    res.status(400).json({ code: 400, success: false, message: error.message });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body;
    // req.user is set by verifyToken middleware
    const inviterId = req.user ? req.user.user_id : req.body.inviterId;

    if (!inviterId) {
       return res.status(400).json({ code: 400, success: false, message: "Không tìm thấy thông tin người mời." });
    }

    const result = await projectMemberService.inviteMember(projectId, email, role, inviterId);
    res.status(200).json({ code: 200, success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ code: 400, success: false, message: error.message });
  }
};

export const acceptInvite = async (req, res) => {
  try {
    const { token } = req.query; // Accept via query param
    if (!token) {
      return res.status(400).json({ code: 400, success: false, message: "Token không được cung cấp." });
    }

    const result = await projectMemberService.acceptInvite(token);
    res.status(200).json({ code: 200, success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ code: 400, success: false, message: error.message });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const { role } = req.body;
    const result = await projectMemberService.updateMemberRole(projectId, userId, role);
    res.status(200).json({ code: 200, success: true, message: "Cập nhật quyền thành công.", data: result });
  } catch (error) {
    res.status(400).json({ code: 400, success: false, message: error.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const result = await projectMemberService.removeMember(projectId, userId);
    res.status(200).json({ code: 200, success: true, message: "Xóa thành viên thành công.", data: result });
  } catch (error) {
    res.status(400).json({ code: 400, success: false, message: error.message });
  }
};
