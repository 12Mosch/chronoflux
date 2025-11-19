#!/bin/bash

# Detect if running in WSL and get Windows host IP
if grep -qi microsoft /proc/version; then
    WINDOWS_HOST=$(ip route show | grep -i default | awk '{ print $3}')
    DEFAULT_OLLAMA_URL="http://${WINDOWS_HOST}:11434"
    echo "🐧 Detected WSL environment"
    echo "   Windows host IP: $WINDOWS_HOST"
else
    DEFAULT_OLLAMA_URL="http://localhost:11434"
fi

# Use environment variable or default
OLLAMA_URL="${OLLAMA_URL:-$DEFAULT_OLLAMA_URL}"

echo "Testing Ollama connection..."
echo "Using Ollama URL: $OLLAMA_URL"
echo ""

# Test if Ollama is running
echo "1. Checking if Ollama server is running..."
if curl -s --connect-timeout 5 "${OLLAMA_URL}/api/tags" > /dev/null 2>&1; then
    echo "   ✅ Ollama server is running"
else
    echo "   ❌ Ollama server is NOT running or not accessible"
    echo ""
    if grep -qi microsoft /proc/version; then
        echo "   WSL Setup Required:"
        echo "   1. In Windows PowerShell (as Admin):"
        echo "      \$env:OLLAMA_HOST = \"0.0.0.0:11434\""
        echo "   2. Restart Ollama: ollama serve"
        echo "   3. Allow port 11434 in Windows Firewall"
        echo ""
        echo "   Or run: ./setup-wsl-ollama.sh"
    else
        echo "   Please start it with: ollama serve"
    fi
    exit 1
fi

echo ""
echo "2. Listing available models..."
MODELS=$(curl -s "${OLLAMA_URL}/api/tags")
echo "$MODELS" | jq '.'

echo ""
echo "3. Checking for qwen3:8b model..."
if echo "$MODELS" | jq -e '.models[] | select(.name == "qwen3:8b")' > /dev/null 2>&1; then
    echo "   ✅ qwen3:8b model is available"
else
    echo "   ❌ qwen3:8b model is NOT available"
    echo "   Please install it with: ollama pull qwen3:8b"
    exit 1
fi

echo ""
echo "4. Testing generation with qwen3:8b..."
RESPONSE=$(curl -s "${OLLAMA_URL}/api/generate" -d '{
  "model": "qwen3:8b",
  "prompt": "Say hello in JSON format: {\"message\": \"your message here\"}",
  "stream": false
}')

echo "   Response:"
echo "$RESPONSE" | jq '.'

echo ""
echo "✅ All tests passed! Ollama is ready to use."
echo ""
echo "To use this in your app, set:"
echo "export OLLAMA_URL=\"$OLLAMA_URL\""

