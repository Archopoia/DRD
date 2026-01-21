#include "framework/core/Window.h"
#include "framework/core/Input.h"
#include "framework/core/Time.h"
#include "framework/utils/Log.h"
#include "framework/renderer/Raycaster.h"
#include "framework/renderer/Renderer2D.h"
#include "framework/renderer/Font.h"
#include "framework/renderer/UIRenderer.h"
#include "framework/utils/DebugOverlay.h"
#include "framework/renderer/SpriteRenderer.h"
#include "framework/renderer/Texture.h"
#include "game/actors/Player.h"
#include "game/actors/Actor.h"
#include "game/world/GridMap.h"
#include "game/world/Chunk.h"
#include "game/world/MapGenerator.h"
#include "game/world/Collision.h"
#include "game/systems/QuestSystem.h"
#define WIN32_LEAN_AND_MEAN
#include <SDL2/SDL_opengl.h>
#undef DrawText  // Undefine Windows macro if present
#include <SDL2/SDL.h>
#include <cstdio>
#include <cstdlib>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

using namespace Arena;

Window* g_window = nullptr;
bool g_running = true;
Player* g_player = nullptr;
ChunkManager* g_world = nullptr;
GridMap* g_testMap = nullptr;
Font* g_font = nullptr;
bool g_showDebug = false;

// Enemies
static const int MAX_ENEMIES = 32;
Actor g_enemies[MAX_ENEMIES];
int g_enemyCount = 0;
SpriteEntity g_enemySprites[MAX_ENEMIES];
uint32_t g_enemyTextureId = 0;

// Helper function to attack with Player
static void AttackWithPlayer(Player& player, Actor& target) {
    int damage = player.GetStats().attack - target.stats.defense;
    if (damage < 1) damage = 1;
    
    target.stats.health -= damage;
    if (target.stats.health < 0) {
        target.stats.health = 0;
    }
}

// Helper function to attack Player
static void AttackPlayer(Actor& attacker, Player& player) {
    int damage = attacker.stats.attack - player.GetStats().defense;
    if (damage < 1) damage = 1;
    
    Stats& playerStats = player.GetStats();
    playerStats.health -= damage;
    if (playerStats.health < 0) {
        playerStats.health = 0;
    }
}

void GameLoop() {
    if (!g_window || !g_running) {
        return;
    }
    
    // Update systems
    Time::Update();
    Input::Update();
    g_window->PollEvents();
    
    if (g_window->ShouldClose()) {
        g_running = false;
        return;
    }
    
    // Handle ESC to exit or toggle debug
    static bool escPressed = false;
    if (Input::IsKeyPressed(SDLK_ESCAPE)) {
        if (SDL_GetRelativeMouseMode()) {
            // Release mouse if captured
            SDL_SetRelativeMouseMode(SDL_FALSE);
        } else {
            // Exit if mouse not captured
            g_running = false;
            return;
        }
    }
    
    // Toggle debug overlay with F1
    if (Input::IsKeyPressed(SDLK_F1)) {
        g_showDebug = !g_showDebug;
        DebugOverlay::SetVisible(g_showDebug);
    }
    
    // Capture mouse for first-person controls (click to capture)
    static bool mouseCaptured = false;
    if (Input::IsMousePressed(0) && !mouseCaptured) {
        SDL_CaptureMouse(SDL_TRUE);
        SDL_SetRelativeMouseMode(SDL_TRUE);
        mouseCaptured = true;
    }
    // Update mouse captured state
    mouseCaptured = SDL_GetRelativeMouseMode() != SDL_FALSE;
    
    // Update player (use GridMap for collision since that's what we're rendering)
    if (g_player && g_testMap) {
        g_player->Update(Time::GetDeltaTime(), *g_testMap);
        
        // Update enemies
        Vec2 playerPos = g_player->GetPosition();
        for (int i = 0; i < g_enemyCount; i++) {
            if (g_enemies[i].stats.health > 0) {
                // Update AI
                ActorSystem::UpdateAI(g_enemies[i], playerPos, Time::GetDeltaTime());
                
                // Handle enemy attacks on player
                float distToPlayer = (g_enemies[i].position - playerPos).Length();
                if (g_enemies[i].state == ActorState::Attack && distToPlayer < 1.5f) {
                    static float lastAttackTime[MAX_ENEMIES] = {0};
                    float currentTime = Time::GetTotalTime();
                    if (currentTime - lastAttackTime[i] > 1.0f) { // Attack every second
                        AttackPlayer(g_enemies[i], *g_player);
                        lastAttackTime[i] = currentTime;
                        Log::Info("Enemy attacked player! Health: %d", g_player->GetStats().health);
                    }
                }
                
                // Update sprite position
                g_enemySprites[i].position = g_enemies[i].position;
                g_enemySprites[i].visible = true;
            } else {
                g_enemySprites[i].visible = false;
            }
        }
        
        // Player attack (left click)
        static bool lastMouseDown = false;
        bool mouseDown = Input::IsMouseDown(0);
        if (mouseDown && !lastMouseDown && mouseCaptured) {
            // Cast ray to find enemy in front
            RaycastHit hit = Raycaster::CastRay(
                g_player->GetCamera().GetPosition(),
                g_player->GetCamera().GetDirection(),
                *g_testMap,
                3.0f
            );
            
            if (hit.hit) {
                // Check if we hit an enemy
                for (int i = 0; i < g_enemyCount; i++) {
                    if (g_enemies[i].stats.health > 0) {
                        Vec2 enemyPos = g_enemies[i].position;
                        int enemyX = (int)floorf(enemyPos.x);
                        int enemyY = (int)floorf(enemyPos.y);
                        
                        if (enemyX == hit.mapX && enemyY == hit.mapY) {
                            // Hit enemy!
                            int oldHealth = g_enemies[i].stats.health;
                            AttackWithPlayer(*g_player, g_enemies[i]);
                            Log::Info("Player attacked enemy! Enemy health: %d", g_enemies[i].stats.health);
                            
                            // Check if enemy died
                            if (oldHealth > 0 && g_enemies[i].stats.health <= 0) {
                                // Update quest objectives (kill enemy type 0)
                                QuestSystem::UpdateObjective(0, 0, 0, 1);
                            }
                            break;
                        }
                    }
                }
            }
        }
        lastMouseDown = mouseDown;
    }
    
    // Clear screen
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    
    // Render raycaster
    if (g_player && g_testMap) {
        int width = g_window->GetWidth();
        int height = g_window->GetHeight();
        Raycaster::RenderFrame(g_player->GetCamera(), *g_testMap, width, height);
        
        // Render enemy sprites
        if (g_enemyCount > 0 && g_enemyTextureId != 0) {
            Raycaster::RenderSprites(g_enemySprites, g_enemyCount, g_player->GetCamera(), width, height);
        }
        
        // Render UI overlay
        if (g_font) {
            UIRenderer::Begin();
            
            // Instructions (if mouse not captured)
            if (!mouseCaptured) {
                UIRenderer::DrawTextCentered(*g_font, "Click to start - WASD to move, Mouse to look", 
                    width / 2.0f, height - 80.0f, width, 0xFFFFFFFF, 1.0f);
                UIRenderer::DrawTextCentered(*g_font, "F1: Debug | ESC: Exit", 
                    width / 2.0f, height - 50.0f, width, 0xCCCCCCFF, 0.9f);
            } else {
                // Show controls hint when playing
                UIRenderer::DrawText(*g_font, "F1: Debug | ESC: Release Mouse", 10.0f, height - 30.0f, 0xCCCCCCFF, 0.7f);
            }
            
            // Position info (top left)
            char posText[128];
            Vec2 playerPos = g_player->GetPosition();
            float rot = g_player->GetCamera().GetRotation();
            snprintf(posText, sizeof(posText), "Pos: (%.1f, %.1f) Rot: %.1f", playerPos.x, playerPos.y, rot * 57.2958f);
            UIRenderer::DrawText(*g_font, posText, 10.0f, 10.0f, 0xFFFFFFFF, 0.8f);
            
            // FPS (top right)
            char fpsText[64];
            snprintf(fpsText, sizeof(fpsText), "FPS: %.0f", Time::GetFPS());
            float fpsWidth = g_font->GetTextWidth(fpsText, 0.8f);
            UIRenderer::DrawText(*g_font, fpsText, width - fpsWidth - 10.0f, 10.0f, 0x00FF00FF, 0.8f);
            
            // Simple minimap (top right, below FPS)
            float minimapSize = 150.0f;
            float minimapX = width - minimapSize - 10.0f;
            float minimapY = 40.0f;
            float minimapScale = minimapSize / 64.0f; // Map is 64x64
            
            // Minimap background
            UIRenderer::DrawPanel(minimapX, minimapY, minimapSize, minimapSize, 0x00000080, 0xFFFFFFFF);
            
            // Draw map tiles
            for (int y = 0; y < 64; y++) {
                for (int x = 0; x < 64; x++) {
                    if (g_testMap->IsSolid(x, y)) {
                        float px = minimapX + x * minimapScale;
                        float py = minimapY + y * minimapScale;
                        Renderer2D::DrawRect(px, py, minimapScale, minimapScale, 0x808080FF, true);
                    }
                }
            }
            
            // Draw player position
            float playerMapX = minimapX + playerPos.x * minimapScale;
            float playerMapY = minimapY + playerPos.y * minimapScale;
            Renderer2D::DrawCircle(playerMapX, playerMapY, 3.0f, 0x00FF00FF, true);
            
            // Draw player direction
            Vec2 dir = g_player->GetCamera().GetDirection();
            Renderer2D::DrawLine(playerMapX, playerMapY, 
                playerMapX + dir.x * 8.0f, playerMapY + dir.y * 8.0f, 0x00FF00FF);
            
            // Crosshair (center of screen)
            if (mouseCaptured) {
                float crosshairSize = 10.0f;
                float centerX = width / 2.0f;
                float centerY = height / 2.0f;
                Renderer2D::DrawLine(centerX - crosshairSize, centerY, centerX + crosshairSize, centerY, 0xFFFFFFFF);
                Renderer2D::DrawLine(centerX, centerY - crosshairSize, centerX, centerY + crosshairSize, 0xFFFFFFFF);
            }
            
            // Quest UI (bottom left)
            int activeCount = 0;
            Quest* activeQuests = QuestSystem::GetActiveQuests(&activeCount, 4);
            if (activeCount > 0) {
                float questY = height - 150.0f;
                for (int i = 0; i < activeCount; i++) {
                    Quest& quest = activeQuests[i];
                    char questText[256];
                    snprintf(questText, sizeof(questText), "%s: %d/%d", 
                        quest.name, quest.currentCount, quest.targetCount);
                    UIRenderer::DrawText(*g_font, questText, 10.0f, questY, 0xFFFF00FF, 0.7f);
                    questY += 20.0f;
                }
            }
            
            // Debug overlay
            if (g_showDebug) {
                DebugOverlay::Render(*g_font, width, height);
            }
            
            UIRenderer::End();
        }
    }
    
    // Swap buffers
    g_window->SwapBuffers();
    
    // Log FPS every second
    static float lastLogTime = 0.0f;
    if (Time::GetTotalTime() - lastLogTime >= 1.0f) {
        Log::Info("FPS: %.2f, Delta: %.4f", Time::GetFPS(), Time::GetDeltaTime());
        lastLogTime = Time::GetTotalTime();
    }
}

#ifdef __EMSCRIPTEN__
void EmscriptenMainLoop() {
    GameLoop();
}
#endif

int main(int argc, char* argv[]) {
    Log::Info("Arena Framework - Starting");
    
    // Initialize systems
    Time::Init();
    Input::Init();
    Renderer2D::Init(1280, 720);
    UIRenderer::Init(1280, 720);
    DebugOverlay::Init();
    
    // Create window
    WindowConfig config;
    config.width = 1280;
    config.height = 720;
    config.title = "Arena Framework - Raycaster Demo";
    config.fullscreen = false;
    config.vsync = true;
    
    g_window = new Window();
    if (!g_window->Create(config)) {
        Log::Error("Failed to create window");
        delete g_window;
        return 1;
    }
    
    // Create test map
    g_testMap = new GridMap();
    if (!g_testMap->Create(64, 64)) {
        Log::Error("Failed to create map");
        return 1;
    }
    
    // Generate a simple dungeon
    MapGenerator::GenerateRoomsAndCorridors(*g_testMap, 15, 12345);
    
    // Spawn enemies at random open positions
    srand(12345);
    g_enemyCount = 0;
    for (int attempt = 0; attempt < 100 && g_enemyCount < 10; attempt++) {
        int x = 5 + (rand() % (g_testMap->GetWidth() - 10));
        int y = 5 + (rand() % (g_testMap->GetHeight() - 10));
        
        if (!g_testMap->IsSolid(x, y)) {
            Actor& enemy = g_enemies[g_enemyCount];
            enemy.position = Vec2((float)x + 0.5f, (float)y + 0.5f);
            enemy.rotation = 0.0f;
            enemy.spriteId = 0;
            enemy.stats.health = 50;
            enemy.stats.maxHealth = 50;
            enemy.stats.attack = 5;
            enemy.stats.defense = 2;
            enemy.stats.speed = 1.5f;
            enemy.state = ActorState::Idle;
            enemy.stateTimer = 0.0f;
            enemy.patrolCenter = enemy.position;
            enemy.patrolRadius = 3.0f;
            
            // Create sprite entity
            SpriteEntity& sprite = g_enemySprites[g_enemyCount];
            sprite.position = enemy.position;
            sprite.worldHeight = 0.5f; // Height above ground
            sprite.textureId = g_enemyTextureId;
            sprite.spriteWidth = 64;
            sprite.spriteHeight = 64;
            sprite.scale = 1.0f;
            sprite.visible = true;
            
            g_enemyCount++;
        }
    }
    Log::Info("Spawned %d enemies", g_enemyCount);
    
    // Create player at a safe spawn point (find an open tile)
    g_player = new Player();
    // Find a good spawn point (non-solid tile)
    Vec2 spawnPos(10.0f, 10.0f);
    for (int y = 5; y < 60; y++) {
        for (int x = 5; x < 60; x++) {
            if (!g_testMap->IsSolid(x, y)) {
                spawnPos = Vec2((float)x + 0.5f, (float)y + 0.5f);
                break;
            }
        }
        if (spawnPos.x != 10.0f) break;
    }
    g_player->SetPosition(spawnPos);
    g_player->GetCamera().SetRotation(0.0f);
    Log::Info("Player spawned at: (%.2f, %.2f)", spawnPos.x, spawnPos.y);
    
    // Create chunk manager (for future use with streaming)
    g_world = new ChunkManager();
    g_world->Initialize(64);
    
    // Set raycaster options
    Raycaster::SetWallHeight(1.0f);
    Raycaster::SetFloorColor(0x303030FF);  // Darker floor
    Raycaster::SetCeilingColor(0x505050FF); // Lighter ceiling
    
    // Load enemy texture (create a simple colored texture for now)
    // In a real game, you'd load an actual sprite image
    uint8_t enemyTexData[64 * 64 * 4];
    for (int i = 0; i < 64 * 64; i++) {
        enemyTexData[i * 4 + 0] = 200; // R
        enemyTexData[i * 4 + 1] = 50;  // G
        enemyTexData[i * 4 + 2] = 50;  // B
        enemyTexData[i * 4 + 3] = 255; // A
    }
    g_enemyTextureId = Texture::CreateFromData(enemyTexData, 64, 64, false);
    if (g_enemyTextureId == 0) {
        Log::Warn("Failed to create enemy texture");
    }
    
    // Initialize quest system
    QuestSystem::Initialize();
    
    // Create quest: Kill 5 enemies
    Quest killQuest;
    killQuest.id = 0;
    killQuest.name = "Clear the Dungeon";
    killQuest.description = "Defeat 5 enemies";
    killQuest.state = QuestState::NotStarted;
    killQuest.objectiveType = 0; // Kill
    killQuest.targetId = 0; // Any enemy
    killQuest.currentCount = 0;
    killQuest.targetCount = 5;
    QuestSystem::AddQuest(killQuest);
    QuestSystem::StartQuest(0); // Auto-start first quest
    
    // Create font for UI
    g_font = new Font();
    if (!g_font->Load("", 16)) {
        Log::Warn("Failed to load font, UI text may not display");
    }
    
    Log::Info("Game loop starting");
    Log::Info("Controls: Click to capture mouse, WASD to move, Mouse to look, F1 for debug, ESC to exit");
    
#ifdef __EMSCRIPTEN__
    // Emscripten main loop
    emscripten_set_main_loop(EmscriptenMainLoop, 0, 1);
#else
    // Native main loop
    while (g_running) {
        GameLoop();
    }
#endif
    
    // Cleanup
    if (g_font) {
        g_font->Free();
        delete g_font;
    }
    if (g_world) {
        g_world->Shutdown();
        delete g_world;
    }
    if (g_player) {
        delete g_player;
    }
    if (g_testMap) {
        g_testMap->Destroy();
        delete g_testMap;
    }
    if (g_window) {
        g_window->Destroy();
        delete g_window;
    }
    
    DebugOverlay::Shutdown();
    UIRenderer::Shutdown();
    Renderer2D::Shutdown();
    Log::Info("Shutting down");
    return 0;
}
