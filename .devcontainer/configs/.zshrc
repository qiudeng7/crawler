# 配置别名
alias clera="clear"
alias zshrc="vim ~/.zshrc"
alias vimrc="vim ~/.vimrc"

# ctrl + backspace删除整个单词
# 安装oh-my-zsh 会自带 ctrl+方向键 的快捷键。
bindkey '^H' backward-kill-word
bindkey '5~' kill-word

# zsh插件
plugins=( git z zsh-autosuggestions )

# Path to your Oh My Zsh installation.
export ZSH="$HOME/.oh-my-zsh"

# 主题设置
ZSH_THEME="alanpeabody" # set by `omz`
export ZSH="$HOME/.oh-my-zsh"
source $ZSH/oh-my-zsh.sh

# 开启这个之后，自动补全会自动纠正命令
ENABLE_CORRECTION="true"

# 开启这个之后，自动补全会区分大小写
CASE_SENSITIVE="true"

# 开启这个之后，自动补全会不区分 _ 和 - 连字符，前提是大小写不敏感
HYPHEN_INSENSITIVE="true"

# 添加一些path
export PATH="/home/ubuntu/.local/bin:$PATH"