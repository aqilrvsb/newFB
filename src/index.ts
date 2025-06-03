import { startHttpServer, stopHttpServer } from './http-server.js';
import { serverConfig } from './config.js';

// Main application startup
const main = async () => {
  try {
    console.log('🚀 Starting Dynamic Facebook MCP Server...');
    console.log(`📊 Environment: ${serverConfig.environment}`);
    console.log(`🌐 Port: ${serverConfig.port}`);
    console.log(`👥 Max connections: ${serverConfig.maxConnections}`);
    
    // Start HTTP server with WebSocket support
    await startHttpServer();
    
    console.log('✅ Server successfully started and listening');
    console.log('📋 Available endpoints:');
    console.log(`   - Health check: GET /health`);
    console.log(`   - Authentication: POST /auth`);
    console.log(`   - HTTP MCP: POST /mcp/{userId}`);
    console.log(`   - WebSocket MCP: ws://localhost:${serverConfig.port}/ws/{userId}`);
    
  } catch (error) {
    console.error('❌ Critical error during server startup:', error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  console.log(`\n🔄 Received ${signal}. Shutting down gracefully...`);
  
  try {
    await stopHttpServer();
    console.log('✅ Server shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Signal handlers
process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => shutdown('SIGTERM')); // Terminate signal

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main();