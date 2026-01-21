#include "Window.h"
#include "framework/utils/Log.h"
#include <SDL2/SDL.h>
#include <SDL2/SDL_opengl.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <GL/gl.h>
#else
#include <SDL2/SDL_opengl.h>
#endif

namespace Arena {

Window::Window() 
    : m_window(nullptr)
    , m_glContext(nullptr)
    , m_width(0)
    , m_height(0)
    , m_shouldClose(false)
{
}

Window::~Window() {
    Destroy();
}

bool Window::Create(const WindowConfig& config) {
    // Initialize SDL
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        Log::Error("Failed to initialize SDL: %s", SDL_GetError());
        return false;
    }
    
    // Set OpenGL attributes
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 2);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 0);
    SDL_GL_SetAttribute(SDL_GL_DOUBLEBUFFER, 1);
    SDL_GL_SetAttribute(SDL_GL_DEPTH_SIZE, 24);
    SDL_GL_SetAttribute(SDL_GL_STENCIL_SIZE, 8);
    
#ifdef __EMSCRIPTEN__
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_ES);
#else
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);
#endif
    
    // Create window
    Uint32 flags = SDL_WINDOW_OPENGL | SDL_WINDOW_SHOWN | SDL_WINDOW_RESIZABLE;
    if (config.fullscreen) {
        flags |= SDL_WINDOW_FULLSCREEN;
    }
    
    m_window = SDL_CreateWindow(
        config.title,
        SDL_WINDOWPOS_UNDEFINED,
        SDL_WINDOWPOS_UNDEFINED,
        config.width,
        config.height,
        flags
    );
    
    if (!m_window) {
        Log::Error("Failed to create window: %s", SDL_GetError());
        SDL_Quit();
        return false;
    }
    
    // Create OpenGL context
    m_glContext = SDL_GL_CreateContext((SDL_Window*)m_window);
    if (!m_glContext) {
        Log::Error("Failed to create OpenGL context: %s", SDL_GetError());
        SDL_DestroyWindow((SDL_Window*)m_window);
        SDL_Quit();
        return false;
    }
    
    // Enable VSync
    if (config.vsync) {
        SDL_GL_SetSwapInterval(1);
    } else {
        SDL_GL_SetSwapInterval(0);
    }
    
    m_width = config.width;
    m_height = config.height;
    m_shouldClose = false;
    
    // Initialize OpenGL
    glViewport(0, 0, m_width, m_height);
    glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
    glEnable(GL_DEPTH_TEST);
    
    Log::Info("Window created: %dx%d", m_width, m_height);
    
    return true;
}

void Window::Destroy() {
    if (m_glContext) {
        SDL_GL_DeleteContext((SDL_GLContext)m_glContext);
        m_glContext = nullptr;
    }
    
    if (m_window) {
        SDL_DestroyWindow((SDL_Window*)m_window);
        m_window = nullptr;
    }
    
    SDL_Quit();
}

void Window::SwapBuffers() {
    if (m_window && m_glContext) {
        SDL_GL_SwapWindow((SDL_Window*)m_window);
    }
}

void Window::PollEvents() {
    SDL_Event event;
    while (SDL_PollEvent(&event)) {
        switch (event.type) {
            case SDL_QUIT:
                m_shouldClose = true;
                break;
            case SDL_WINDOWEVENT:
                if (event.window.event == SDL_WINDOWEVENT_RESIZED) {
                    m_width = event.window.data1;
                    m_height = event.window.data2;
                    glViewport(0, 0, m_width, m_height);
                }
                break;
        }
        
        // Forward events to Input system (handled in Input::Update)
    }
}

} // namespace Arena
