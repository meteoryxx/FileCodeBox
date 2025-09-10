# @Time    : 2023/8/15 17:43
# @Author  : Lan
# @File    : depends.py
# @Software: PyCharm
from fastapi import Header, HTTPException, Depends, Form
from fastapi.requests import Request
from typing import Optional
import base64
import hmac
import json
import time
from core.settings import settings
from apps.admin.services import FileService, ConfigService, LocalFileService


def create_token(data: dict, expires_in: int = 3600 * 24 * 30) -> str:
    """
    创建JWT token
    :param data: 数据负载
    :param expires_in: 过期时间(秒)，默认5天
    """
    header = base64.b64encode(
        json.dumps({"alg": "HS256", "typ": "JWT"}).encode()
    ).decode()
    payload = base64.b64encode(
        json.dumps({**data, "exp": int(time.time()) + expires_in}).encode()
    ).decode()

    signature = hmac.new(
        settings.admin_token.encode(), f"{header}.{payload}".encode(), "sha256"
    ).digest()
    signature = base64.b64encode(signature).decode()

    return f"{header}.{payload}.{signature}"


def verify_token(token: str) -> dict:
    """
    验证JWT token
    :param token: JWT token
    :return: 解码后的数据
    """
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")

        # 验证签名
        expected_signature = hmac.new(
            settings.admin_token.encode(),
            f"{header_b64}.{payload_b64}".encode(),
            "sha256",
        ).digest()
        expected_signature_b64 = base64.b64encode(expected_signature).decode()

        if signature_b64 != expected_signature_b64:
            raise ValueError("无效的签名")

        # 解码payload
        payload = json.loads(base64.b64decode(payload_b64))

        # 检查是否过期
        if payload.get("exp", 0) < time.time():
            raise ValueError("token已过期")

        return payload
    except Exception as e:
        raise ValueError(f"token验证失败: {str(e)}")


async def admin_required(
    authorization: str = Header(default=None), request: Request = None
):
    """
    验证管理员权限
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            is_admin = False
        else:
            try:
                token = authorization.split(" ")[1]
                payload = verify_token(token)
                is_admin = payload.get("is_admin", False)
            except ValueError as e:
                is_admin = False

        if request.url.path.startswith("/share/"):
            if not settings.openUpload and not is_admin:
                raise HTTPException(
                    status_code=403, detail="本站未开启游客上传，如需上传请先登录后台"
                )
        else:
            if not is_admin:
                raise HTTPException(status_code=401, detail="未授权或授权校验失败")
        return is_admin
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


async def share_required_login(
    authorization: str = Header(default=None), 
    request: Request = None,
    password: Optional[str] = None
):
    """
    验证分享上传权限
    
    当settings.openUpload为False时，支持两种验证方式：
    1. 管理员token验证 (通过authorization header)
    2. 密码验证 (通过password参数)
    当settings.openUpload为True时，允许游客上传
    
    :param authorization: 认证头信息
    :param request: 请求对象
    :param password: 管理员密码(可选)
    :return: 验证结果
    """
    if not settings.openUpload:
        # 首先尝试token验证
        if authorization and authorization.startswith("Bearer "):
            try:
                token = authorization.split(" ")[1]
                payload = verify_token(token)
                if payload.get("is_admin", False):
                    return True
            except ValueError:
                pass  # token验证失败，继续尝试密码验证
        
        # 如果token验证失败或没有token，尝试密码验证
        if password:
            if password == settings.admin_token:
                return True
            else:
                raise HTTPException(status_code=401, detail="密码错误")
        
        # 如果都没有或都验证失败
        raise HTTPException(
            status_code=403, detail="本站未开启游客上传。您可以：1. 在上传表单中添加 'password' 字段输入管理员密码；2. 或在请求头中添加 'X-Admin-Password' 字段"
        )
    
    return True


async def share_upload_required(
    authorization: str = Header(default=None),
    password: Optional[str] = Form(default=None),
    request: Request = None
):
    """
    上传接口专用的验证函数，支持从 Form 中获取密码
    """
    return await share_required_login(authorization, request, password)


async def share_chunk_required(
    authorization: str = Header(default=None),
    admin_password: Optional[str] = Header(default=None, alias="X-Admin-Password"),
    request: Request = None
):
    """
    分块上传接口专用的验证函数，支持从 Header 中获取密码
    """
    return await share_required_login(authorization, request, admin_password)


async def get_file_service():
    return FileService()


async def get_config_service():
    return ConfigService()


async def get_local_file_service():
    return LocalFileService()
