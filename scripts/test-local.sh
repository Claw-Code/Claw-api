#!/bin/bash

# Local testing script for Claw API

echo "🧪 Testing Claw API locally..."

API_URL="http://localhost:8000"

# Test health endpoint
echo "🏥 Testing health endpoint..."
health_response=$(curl -s "$API_URL/health")
if [[ $health_response == *"ok"* ]]; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# Test user registration
echo "👤 Testing user registration..."
user_response=$(curl -s -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"username": "testuser", "email": "test@example.com"}')

if [[ $user_response == *"success"* ]]; then
    echo "✅ User registration passed"
    user_id=$(echo $user_response | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    echo "📝 User ID: $user_id"
else
    echo "❌ User registration failed"
    echo "Response: $user_response"
fi

# Test chat creation
if [ ! -z "$user_id" ]; then
    echo "💬 Testing chat creation..."
    chat_response=$(curl -s -X POST "$API_URL/api/chat/create" \
        -H "Content-Type: application/json" \
        -d "{\"userId\": \"$user_id\", \"title\": \"Test Chat\"}")
    
    if [[ $chat_response == *"success"* ]]; then
        echo "✅ Chat creation passed"
        chat_id=$(echo $chat_response | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
        echo "📝 Chat ID: $chat_id"
    else
        echo "❌ Chat creation failed"
        echo "Response: $chat_response"
    fi
fi

# Test code generation (if chat was created)
if [ ! -z "$chat_id" ]; then
    echo "🤖 Testing code generation..."
    code_response=$(curl -s -X POST "$API_URL/api/chat/$chat_id/message" \
        -H "Content-Type: application/json" \
        -d '{"content": "Create a simple React button component", "framework": "react"}')
    
    if [[ $code_response == *"success"* ]]; then
        echo "✅ Code generation initiated"
        echo "📝 Response: $(echo $code_response | head -c 200)..."
    else
        echo "❌ Code generation failed"
        echo "Response: $code_response"
    fi
fi

# Test MongoDB connection
echo "🗄️  Testing MongoDB connection..."
mongo_test=$(docker exec v0-local-dev mongo --eval "db.adminCommand('ismaster')" 2>/dev/null)
if [[ $mongo_test == *"ismaster"* ]]; then
    echo "✅ MongoDB connection passed"
else
    echo "❌ MongoDB connection failed"
fi

# Show database contents
echo "📊 Database contents:"
docker exec v0-local-dev mongo v0_clone --eval "
    print('Users count: ' + db.users.count());
    print('Chats count: ' + db.chats.count());
    print('Sample user: '); 
    printjson(db.users.findOne());
" 2>/dev/null

echo ""
echo "✅ Local testing complete!"
echo "🌐 API Documentation: $API_URL/docs"
