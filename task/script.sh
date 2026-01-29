#!/bin/bash

# プロジェクトルートディレクトリ
PROJECT_ROOT="/Users/hideyukimatsui/Desktop/myfolder/tools/sumaregi-support"

# テンプレートファイルのパス
TEMPLATE_FILE="_template.md"

# ファイル名を引数から取得
if [ -z "$1" ]; then
    echo "使用方法: $0 <ファイル名>"
    exit 1
fi

# 拡張子なしのファイル名を取得し、.mdを付ける
BASENAME="$1"
FILENAME="${BASENAME}.md"

# 現在のディレクトリで最大の連番を取得
MAX_NUM=$(ls -1 | grep -E '^[0-9]{3}_' | sed 's/^\([0-9]\{3\}\)_.*/\1/' | sort -n | tail -1)

# 最大値が見つからない場合は000から開始、見つかった場合は+1
if [ -z "$MAX_NUM" ]; then
    NEXT_NUM="000"
else
    NEXT_NUM=$(printf "%03d" $((10#$MAX_NUM + 1)))
fi

# ファイル名に連番を付ける
FILENAME="${NEXT_NUM}_${FILENAME}"

# テンプレートファイルの存在確認
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "エラー: テンプレートファイル '$TEMPLATE_FILE' が見つかりません。"
    exit 1
fi

# ファイルが既に存在する場合は確認
if [ -f "$FILENAME" ]; then
    read -p "ファイル '$FILENAME' は既に存在します。上書きしますか? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "キャンセルしました。"
        exit 0
    fi
fi

# 拡張子を除いたベース名を取得
BASENAME="${FILENAME%.*}"

# テンプレートを読み込んで、XXXを置き換えてファイルに書き込み
# 絶対パスを取得
FULLPATH="$(cd "$(dirname "$FILENAME")" && pwd)/$(basename "$FILENAME" .md)"

# プロジェクトルートからの相対パスに変換
RELATIVE_PATH="${FULLPATH#$PROJECT_ROOT/}"

# 前の番号のファイルリストを先頭に追加
if [ "$NEXT_NUM" != "000" ]; then
    PREV_NUM=$(printf "%03d" $((10#$NEXT_NUM - 1)))
    
    # 前の番号で始まるファイルを取得して追記
    for file in $(ls -1 | grep "^${PREV_NUM}_" | sort); do
        FILE_FULLPATH="$(pwd)/$file"
        FILE_RELATIVE="${FILE_FULLPATH#$PROJECT_ROOT/}"
        echo "- $FILE_RELATIVE" >> "$FILENAME"
    done
    
    echo "" >> "$FILENAME"
    
    # テンプレートを追記
    sed "s|XXX|${RELATIVE_PATH}|g" "$TEMPLATE_FILE" >> "$FILENAME"
else
    # 000の場合はテンプレートのみ
    sed "s|XXX|${RELATIVE_PATH}|g" "$TEMPLATE_FILE" > "$FILENAME"
fi

echo "ファイル '$FILENAME' を作成しました。"

# VSCodeで開く
code "$FILENAME"