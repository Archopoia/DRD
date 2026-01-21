#pragma once

namespace Arena {

struct WindowConfig {
    int width = 1280;
    int height = 720;
    const char* title = "Arena Framework";
    bool fullscreen = false;
    bool vsync = true;
};

class Window {
public:
    Window();
    ~Window();
    
    bool Create(const WindowConfig& config);
    void Destroy();
    
    void SwapBuffers();
    void PollEvents();
    
    bool ShouldClose() const { return m_shouldClose; }
    int GetWidth() const { return m_width; }
    int GetHeight() const { return m_height; }
    
    void* GetNativeWindow() const { return m_window; }
    void* GetGLContext() const { return m_glContext; }

private:
    void* m_window;
    void* m_glContext;
    int m_width;
    int m_height;
    bool m_shouldClose;
};

} // namespace Arena
