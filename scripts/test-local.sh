#!/bin/bash

<<<<<<< HEAD
<<<<<<< HEAD
# Local testing script for Claw API with pre-built MongoDB

echo "🧪 Testing Claw API locally with pre-built MongoDB..."
=======
# Local testing script for Claw API

echo "🧪 Testing Claw API locally..."
>>>>>>> d07d2a6 (Init API)
=======
# Local testing script for Claw API with pre-built MongoDB

echo "🧪 Testing Claw API locally with pre-built MongoDB..."
>>>>>>> 9ce6ccf (Updated dockerScript)

API_URL="http://localhost:8000"

# Test health endpoint
echo "🏥 Testing health endpoint..."
health_response=$(curl -s "$API_URL/health")
if [[ $health_response == *"ok"* ]]; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
<<<<<<< HEAD
<<<<<<< HEAD
    echo "Response: $health_response"
=======
>>>>>>> d07d2a6 (Init API)
=======
    echo "Response: $health_response"
>>>>>>> 9ce6ccf (Updated dockerScript)
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

<<<<<<< HEAD
<<<<<<< HEAD
# Test MongoDB connection (try different container names)
echo "🗄️  Testing MongoDB connection..."
mongo_containers=("claw-mongodb" "claw-mongodb-local" "claw-standalone")
mongo_connected=false

for container in "${mongo_containers[@]}"; do
    if docker ps | grep -q $container; then
        echo "Found MongoDB container: $container"
        mongo_test=$(docker exec $container mongosh --eval "db.adminCommand('ismaster')" 2>/dev/null)
        if [[ $mongo_test == *"ismaster"* ]]; then
            echo "✅ MongoDB connection passed ($container)"
            mongo_connected=true
            
            # Show database contents
            echo "📊 Database contents:"
            docker exec $container mongosh claw_api --eval "
                print('Users count: ' + db.users.countDocuments());
                print('Chats count: ' + db.chats.countDocuments());
                print('Sample user: '); 
                printjson(db.users.findOne());
            " 2>/dev/null
            break
        fi
    fi
done

if [ "$mongo_connected" = false ]; then
    echo "❌ MongoDB connection failed - no accessible container found"
fi

# Test Docker Compose services
echo ""
echo "🐳 Checking Docker services..."
if command -v docker-compose &> /dev/null; then
    compose_cmd="docker-compose"
else
    compose_cmd="docker compose"
fi

# Check which compose file is running
if docker ps | grep -q claw-mongodb-local; then
    echo "📋 Local development services:"
    $compose_cmd -f docker-compose.local.yml ps
elif docker ps | grep -q claw-standalone; then
    echo "📋 Standalone service:"
    $compose_cmd -f docker-compose.standalone.yml ps
elif docker ps | grep -q claw-mongodb; then
    echo "📋 Production-like services:"
    $compose_cmd ps
else
    echo "⚠️  No recognized Claw API services found"
fi

echo ""
echo "✅ Claw API local testing complete!"
echo "🌐 API Documentation: $API_URL/docs"
echo ""
echo "🔧 Troubleshooting commands:"
echo "- View API logs: docker logs claw-local-dev -f"
echo "- View MongoDB logs: docker logs claw-mongodb-local -f"
echo "- MongoDB shell: docker exec -it claw-mongodb-local mongosh claw_api"
echo "- Restart services: $compose_cmd restart"
=======
# Test MongoDB connection
=======
# Test MongoDB connection (try different container names)
>>>>>>> 9ce6ccf (Updated dockerScript)
echo "🗄️  Testing MongoDB connection..."
mongo_containers=("claw-mongodb" "claw-mongodb-local" "claw-standalone")
mongo_connected=false

for container in "${mongo_containers[@]}"; do
    if docker ps | grep -q $container; then
        echo "Found MongoDB container: $container"
        mongo_test=$(docker exec $container mongosh --eval "db.adminCommand('ismaster')" 2>/dev/null)
        if [[ $mongo_test == *"ismaster"* ]]; then
            echo "✅ MongoDB connection passed ($container)"
            mongo_connected=true
            
            # Show database contents
            echo "📊 Database contents:"
            docker exec $container mongosh claw_api --eval "
                print('Users count: ' + db.users.countDocuments());
                print('Chats count: ' + db.chats.countDocuments());
                print('Sample user: '); 
                printjson(db.users.findOne());
            " 2>/dev/null
            break
        fi
    fi
done

if [ "$mongo_connected" = false ]; then
    echo "❌ MongoDB connection failed - no accessible container found"
fi

# Test Docker Compose services
echo ""
echo "🐳 Checking Docker services..."
if command -v docker-compose &> /dev/null; then
    compose_cmd="docker-compose"
else
    compose_cmd="docker compose"
fi

# Check which compose file is running
if docker ps | grep -q claw-mongodb-local; then
    echo "📋 Local development services:"
    $compose_cmd -f docker-compose.local.yml ps
elif docker ps | grep -q claw-standalone; then
    echo "📋 Standalone service:"
    $compose_cmd -f docker-compose.standalone.yml ps
elif docker ps | grep -q claw-mongodb; then
    echo "📋 Production-like services:"
    $compose_cmd ps
else
    echo "⚠️  No recognized Claw API services found"
fi

echo ""
echo "✅ Claw API local testing complete!"
echo "🌐 API Documentation: $API_URL/docs"
<<<<<<< HEAD
>>>>>>> d07d2a6 (Init API)
=======
echo ""
echo "🔧 Troubleshooting commands:"
echo "- View API logs: docker logs claw-local-dev -f"
echo "- View MongoDB logs: docker logs claw-mongodb-local -f"
echo "- MongoDB shell: docker exec -it claw-mongodb-local mongosh claw_api"
echo "- Restart services: $compose_cmd restart"
>>>>>>> 9ce6ccf (Updated dockerScript)
