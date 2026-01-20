FROM ubuntu:noble

WORKDIR /workspace

ENV DEBIAN_FRONTEND=noninteractive

# apt换源
RUN cp /etc/apt/sources.list.d/ubuntu.sources /etc/apt/sources.list.d/qinghua_mirror.sources
RUN sed -i 's/archive.ubuntu.com/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/qinghua_mirror.sources && \
    sed -i 's/security.ubuntu.com/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/qinghua_mirror.sources && \
    apt update

# 安装中文语言包 防止终端不能输入中文
# 参考 https://blog.csdn.net/ymz641/article/details/131607024
RUN apt install -y language-pack-zh-hans && \ 
    echo "zh_CN.UTF-8 UTF-8" >> "/etc/locale.gen" && \
    locale-gen
ENV LANG=zh_CN.UTF-8
ENV LANGUAGE=zh_CN:zh


# 安装常用工具
RUN apt install -y git curl wget iputils-ping vim sudo net-tools lsof gpg

# 配置ubuntu用户sudo免密码
RUN echo "ubuntu ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# 添加ubuntu用户到docker组 这样使用docker不需要sudo
# 参考 https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user
RUN groupadd docker && usermod -aG docker ubuntu

# 开始用户空间配置
USER ubuntu

# 设置vim编码
RUN cat > ~/.vimrc <<EOF
set fileencodings=utf-8,ucs-bom,gb18030,gbk,gb2312,cp936
set termencoding=utf-8
set encoding=utf-8
EOF

# 安装zsh
RUN sudo apt install -y zsh
RUN wget https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh -O - | zsh || true
COPY .devcontainer/configs/.zshrc /home/ubuntu/.zshrc
RUN git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions


# 安装claude code
RUN curl -fsSL https://claude.ai/install.sh | bash

CMD [ "sleep","365d" ]