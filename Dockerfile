# ── 建置階段（選用；日後加入建置步驟時才需要）──────────────────────────
# 純 HTML 應用程式不需要建置階段，直接使用 Nginx。

# ── 執行階段 ────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# 移除 Nginx 預設虛擬主機設定
RUN rm /etc/nginx/conf.d/default.conf

# 複製靜態資源
COPY index.html App.jsx style.css /usr/share/nginx/html/

# Nginx 官方映像會自動對 /etc/nginx/templates/ 下的每個 *.template 檔案
# 執行 envsubst，並將結果寫入 /etc/nginx/conf.d/。
# BACKEND_URL 由 container runtime 提供，並在容器啟動時被替換。
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY nginx.proxy_params  /etc/nginx/proxy_params

EXPOSE 80

# 沿用 Nginx 預設 entrypoint（處理 envsubst 與 nginx -g daemon off）
