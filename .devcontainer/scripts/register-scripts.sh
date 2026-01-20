# 注册 scripts 目录下的所有.sh脚本
for script_file in /workspace/.devcontainer/scripts/*.sh; do
    if [ -f "$script_file" ]; then
        # 获取脚本文件名（不包含路径和扩展名）
        script_name=$(basename "$script_file" .sh)

        # 设置执行权限
        chmod +x "$script_file"

        # 创建符号链接到 /usr/local/bin
        sudo ln -sf "$script_file" "/usr/local/bin/$script_name"

        echo "Created symlink for $script_name"
    fi
done