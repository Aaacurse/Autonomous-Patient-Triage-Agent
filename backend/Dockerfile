#Base Image
FROM python:3.11.9-slim

#WORKDIR
WORKDIR /backend

#COPY
COPY requirements.txt .

#RUN
RUN pip install uv && \
uv pip install --no-cache-dir --system -r requirements.txt

#COPY
COPY . .

#EXPOSE
EXPOSE 8000

#Command
CMD [ "uvicorn","main:app","--host","0.0.0.0","--port","8000" ]