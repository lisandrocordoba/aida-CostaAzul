## Para CMD
curl -X POST http://localhost:3000/api/v0/auth/register -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\",\"nombre\":\"Administrador\",\"email\":\"admin@aida.com\"}"



curl -X POST http://localhost:3000/api/v0/auth/register -H "Content-Type: application/json" -d "{\"username\":\"estudiante\",\"password\":\"estudiante\",\"nombre\":\"estudiante\",\"email\":\"estudiante@aida.com\"}"