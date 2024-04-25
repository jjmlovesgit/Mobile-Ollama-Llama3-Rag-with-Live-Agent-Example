#!/bin/bash

# Start the Docker containers using docker-compose
docker-compose up -d

# Check if docker-compose up was successful
if [ $? -eq 0 ]; then
    echo " "
    echo "Docker Base container started successfully!"
    echo " "
else
    echo " "
    echo "Failed to start Docker containers."
    exit 1
fi

# Execute command in ollama-2 container - Make sure you change this to reflect model you are using
echo " "
echo "Step #1 of #2 - Ensure we can find the nomic-embed-text"
docker exec ollama-2 ollama list nomic-embed-text:latest
echo " "
echo "Step #2 of #2 - Launch with Ensure we can find the nomic-embed-text"
docker exec ollama-2 ollama run nomic-embed-text:latest
echo " "

# Execute command in ollama-1 container - Make sure you change this to reflect model you are using
echo " "
echo "Step #1 of #2 - Ensure we can find the llama3_8B_fp16_8092:latest"
docker exec ollama-2 ollama list llama3_8B_fp16_8092:latest
echo " "
echo "Step #2 of #2 - Launch with Ensure we can find the llama3_8B_fp16_8092:latest"
docker exec ollama-2 ollama run llama3_8B_fp16_8092:latest
echo " "

