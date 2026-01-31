
import { PluginConfig } from '../types';

/**
 * Generates the primary PHP file content for the WordPress plugin.
 */
export const generateMainPHPFile = (config: PluginConfig): string => {
  const className = config.name.replace(/\s+/g, '_').toUpperCase();
  const functionPrefix = config.slug.replace(/-/g, '_');

  return `<?php
/**
 * Plugin Name: ${config.name}
 * Description: AI-powered ${config.type.replace('_', ' ')} built with WP-AI Engine.
 * Version: ${config.version}
 * Author: WP-AI Engine User
 * Text Domain: ${config.slug}
 */

if (!defined('ABSPATH')) exit;

class ${className}_Plugin {
    private static $instance = null;
    private $api_endpoint = 'https://api.wp-ai-engine.io/v1/process';
    private $api_key = 'YOUR_WP_AI_API_KEY'; // Provided via SaaS dashboard

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        ${config.features.useShortcode ? "add_shortcode('" + config.slug + "', [$this, 'render_frontend']);" : ''}
        add_action('wp_ajax_${functionPrefix}_action', [$this, 'handle_ajax_request']);
    }

    public function add_admin_menu() {
        add_menu_page(
            '${config.name}',
            '${config.name}',
            'manage_options',
            '${config.slug}',
            [$this, 'render_admin_page'],
            'dashicons-superhero'
        );
    }

    public function enqueue_admin_assets() {
        wp_enqueue_style('${config.slug}-css', 'https://cdn.tailwindcss.com');
    }

    public function render_admin_page() {
        ?>
        <div class="wrap bg-white p-8 rounded-lg shadow-sm mr-5 mt-5 border border-slate-200">
            <h1 class="text-3xl font-bold mb-4" style="color: ${config.primaryColor}">${config.name}</h1>
            <p class="text-slate-600 mb-6">Welcome to your AI-powered ${config.type.replace('_', ' ')} dashboard.</p>
            
            <div id="${config.slug}-app" class="max-w-2xl">
                <div class="bg-slate-50 p-6 rounded border border-slate-200">
                    <h3 class="font-semibold mb-2">AI Settings</h3>
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-1">Your SaaS API Key</label>
                        <input type="password" value="************" readonly class="w-full border rounded p-2 bg-slate-100" />
                        <p class="text-xs text-slate-500 mt-1">Configure this in your WP-AI Engine dashboard.</p>
                    </div>
                    <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Test Connection</button>
                </div>
            </div>
        </div>
        <?php
    }

    public function handle_ajax_request() {
        check_ajax_referer('${functionPrefix}_nonce', 'security');
        
        $user_input = sanitize_text_field($_POST['input']);
        
        // Proxy request to WP-AI Engine SaaS
        $response = wp_remote_post($this->api_endpoint, [
            'body' => json_encode([
                'api_key' => $this->api_key,
                'plugin_id' => '${config.id}',
                'input' => $user_input,
                'prompt_template' => '${config.promptTemplate.replace(/'/g, "\\'")}'
            ]),
            'headers' => ['Content-Type' => 'application/json']
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error('Communication error');
        }

        wp_send_json_success(json_decode(wp_remote_retrieve_body($response)));
    }

    public function render_frontend() {
        ob_start();
        ?>
        <div class="wp-ai-container p-4 border rounded" style="border-color: ${config.primaryColor}">
            <h4 class="font-bold mb-2">${config.name}</h4>
            <div class="ai-content">
                <!-- AI interaction happens here -->
                <p class="text-sm">Powered by WP-AI Engine</p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

${className}_Plugin::get_instance();
`;
};

/**
 * Creates a zip blob containing the plugin structure.
 * Note: Requires JSZip to be loaded globally via index.html script tag.
 */
export const createPluginZip = async (config: PluginConfig): Promise<Blob> => {
  // @ts-ignore - JSZip loaded from CDN
  const zip = new window.JSZip();
  const folder = zip.folder(config.slug);
  
  folder.file(`${config.slug}.php`, generateMainPHPFile(config));
  folder.file('readme.txt', `=== ${config.name} ===
Contributors: wp-ai-engine
Requires at least: 5.8
Tested up to: 6.4
Stable tag: ${config.version}
License: GPLv2 or later

${config.name} is an AI-powered plugin generated using WP-AI Engine.`);

  return await zip.generateAsync({ type: 'blob' });
};
