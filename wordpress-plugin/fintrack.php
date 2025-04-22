<?php
/**
 * Plugin Name: FinTrack - Sistema de Gerenciamento Financeiro
 * Plugin URI: https://solandox.com/fintrack
 * Description: Integração do sistema FinTrack para gerenciamento financeiro pessoal e empresarial.
 * Version: 1.0.0
 * Author: SolandoX
 * Author URI: https://solandox.com
 * Text Domain: fintrack
 * License: GPL v2 or later
 */

// Garantir que o plugin não seja acessado diretamente
if (!defined('ABSPATH')) {
    exit; // Sair se acessado diretamente
}

// Definir constantes
define('FINTRACK_VERSION', '1.0.0');
define('FINTRACK_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('FINTRACK_PLUGIN_URL', plugin_dir_url(__FILE__));

// Classe principal do plugin
class FinTrack_Plugin {
    /**
     * Construtor
     */
    public function __construct() {
        // Hooks de inicialização
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_public_scripts'));
        add_shortcode('fintrack', array($this, 'fintrack_shortcode'));
        
        // Registrar endpoint de API para comunicação com o Supabase
        add_action('rest_api_init', array($this, 'register_api_endpoints'));
    }
    
    /**
     * Adicionar menu ao painel administrativo
     */
    public function add_admin_menu() {
        add_menu_page(
            'FinTrack',                   // Título da página
            'FinTrack',                   // Título do menu
            'manage_options',             // Capacidade necessária
            'fintrack',                   // Slug do menu
            array($this, 'admin_page'),   // Função de callback para renderizar a página
            'dashicons-chart-area',       // Ícone
            30                            // Posição no menu
        );
    }
    
    /**
     * Renderiza a página de administração
     */
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <div id="fintrack-admin-app">
                <div class="fintrack-loading">
                    <h2>Carregando FinTrack...</h2>
                    <p>Se a aplicação não carregar em alguns segundos, verifique se os dados de conexão com o Supabase estão configurados corretamente.</p>
                </div>
            </div>
            
            <div class="fintrack-config">
                <h2>Configuração</h2>
                <form method="post" action="options.php">
                    <?php
                    settings_fields('fintrack_options');
                    do_settings_sections('fintrack');
                    submit_button('Salvar Configurações');
                    ?>
                </form>
            </div>
        </div>
        <?php
    }
    
    /**
     * Carrega scripts e estilos para o painel administrativo
     */
    public function enqueue_admin_scripts($hook) {
        // Apenas carregar nos hooks relevantes
        if ($hook != 'toplevel_page_fintrack') {
            return;
        }
        
        // Estilos
        wp_enqueue_style(
            'fintrack-admin-style',
            FINTRACK_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            FINTRACK_VERSION
        );
        
        // Scripts
        wp_enqueue_script(
            'fintrack-admin-script',
            FINTRACK_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            FINTRACK_VERSION,
            true
        );
        
        // Passar variáveis para o JavaScript
        wp_localize_script(
            'fintrack-admin-script',
            'fintrackParams',
            array(
                'apiUrl' => rest_url('fintrack/v1/'),
                'nonce' => wp_create_nonce('wp_rest'),
                'supabaseUrl' => get_option('fintrack_supabase_url', ''),
                'supabaseKey' => get_option('fintrack_supabase_key', '')
            )
        );
    }
    
    /**
     * Carrega scripts e estilos para o frontend
     */
    public function enqueue_public_scripts() {
        // Estilos
        wp_enqueue_style(
            'fintrack-public-style',
            FINTRACK_PLUGIN_URL . 'assets/css/public.css',
            array(),
            FINTRACK_VERSION
        );
        
        // Scripts
        wp_enqueue_script(
            'fintrack-public-script',
            FINTRACK_PLUGIN_URL . 'assets/js/public.js',
            array('jquery'),
            FINTRACK_VERSION,
            true
        );
        
        // Passar variáveis para o JavaScript
        wp_localize_script(
            'fintrack-public-script',
            'fintrackPublicParams',
            array(
                'apiUrl' => rest_url('fintrack/v1/'),
                'nonce' => wp_create_nonce('wp_rest'),
                'supabaseUrl' => get_option('fintrack_supabase_url', ''),
                'supabaseKey' => get_option('fintrack_supabase_key', '')
            )
        );
    }
    
    /**
     * Shortcode para exibir o FinTrack no frontend
     */
    public function fintrack_shortcode($atts) {
        // Mesclar atributos padrão com os fornecidos
        $atts = shortcode_atts(
            array(
                'view' => 'dashboard', // dashboard, transactions, budgets, goals, etc.
                'height' => '800px',
            ),
            $atts,
            'fintrack'
        );
        
        // Carregar os scripts e estilos necessários
        $this->enqueue_public_scripts();
        
        // Iniciar buffer de saída
        ob_start();
        
        // Template do aplicativo
        ?>
        <div class="fintrack-container" style="height: <?php echo esc_attr($atts['height']); ?>">
            <div id="fintrack-app" data-view="<?php echo esc_attr($atts['view']); ?>">
                <div class="fintrack-loading">
                    <h2>Carregando FinTrack...</h2>
                </div>
            </div>
        </div>
        <?php
        
        // Retornar o conteúdo do buffer
        return ob_get_clean();
    }
    
    /**
     * Registrar endpoints de API para comunicação com o Supabase
     */
    public function register_api_endpoints() {
        register_rest_route('fintrack/v1', '/proxy', array(
            'methods' => 'POST',
            'callback' => array($this, 'api_proxy'),
            'permission_callback' => function () {
                return current_user_can('read');
            }
        ));
        
        register_rest_route('fintrack/v1', '/settings', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_settings'),
            'permission_callback' => function () {
                return current_user_can('manage_options');
            }
        ));
        
        register_rest_route('fintrack/v1', '/settings', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_settings'),
            'permission_callback' => function () {
                return current_user_can('manage_options');
            }
        ));
    }
    
    /**
     * Endpoint de proxy para Supabase
     */
    public function api_proxy($request) {
        $params = $request->get_params();
        
        if (empty($params['endpoint']) || empty($params['method'])) {
            return new WP_Error('missing_params', 'Parâmetros obrigatórios não fornecidos', array('status' => 400));
        }
        
        $supabase_url = get_option('fintrack_supabase_url', '');
        $supabase_key = get_option('fintrack_supabase_key', '');
        
        if (empty($supabase_url) || empty($supabase_key)) {
            return new WP_Error('missing_config', 'Configuração do Supabase incompleta', array('status' => 500));
        }
        
        $endpoint = $params['endpoint'];
        $method = strtoupper($params['method']);
        $data = isset($params['data']) ? $params['data'] : null;
        
        $url = rtrim($supabase_url, '/') . '/' . ltrim($endpoint, '/');
        
        $args = array(
            'method' => $method,
            'headers' => array(
                'Content-Type' => 'application/json',
                'apikey' => $supabase_key,
                'Authorization' => 'Bearer ' . $supabase_key
            ),
            'timeout' => 30
        );
        
        if ($data && in_array($method, array('POST', 'PUT', 'PATCH'))) {
            $args['body'] = json_encode($data);
        }
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            return new WP_Error('api_error', $response->get_error_message(), array('status' => 500));
        }
        
        $body = wp_remote_retrieve_body($response);
        $code = wp_remote_retrieve_response_code($response);
        
        if ($code >= 400) {
            return new WP_Error('api_error', 'Erro na API do Supabase', array(
                'status' => $code,
                'response' => json_decode($body, true)
            ));
        }
        
        return rest_ensure_response(json_decode($body, true));
    }
    
    /**
     * Obtém as configurações do plugin
     */
    public function get_settings() {
        return rest_ensure_response(array(
            'supabaseUrl' => get_option('fintrack_supabase_url', ''),
            'supabaseKey' => get_option('fintrack_supabase_key', ''),
            'primaryColor' => get_option('fintrack_primary_color', '#22c55e'),
            'appName' => get_option('fintrack_app_name', 'FinTrack'),
            'webhookUrl' => get_option('fintrack_webhook_url', 'https://webhook.dev.solandox.com/webhook/fintrack')
        ));
    }
    
    /**
     * Atualiza as configurações do plugin
     */
    public function update_settings($request) {
        $params = $request->get_params();
        
        if (isset($params['supabaseUrl'])) {
            update_option('fintrack_supabase_url', sanitize_text_field($params['supabaseUrl']));
        }
        
        if (isset($params['supabaseKey'])) {
            update_option('fintrack_supabase_key', sanitize_text_field($params['supabaseKey']));
        }
        
        if (isset($params['primaryColor'])) {
            update_option('fintrack_primary_color', sanitize_hex_color($params['primaryColor']));
        }
        
        if (isset($params['appName'])) {
            update_option('fintrack_app_name', sanitize_text_field($params['appName']));
        }
        
        if (isset($params['webhookUrl'])) {
            update_option('fintrack_webhook_url', esc_url_raw($params['webhookUrl']));
        }
        
        return $this->get_settings();
    }
}

// Inicializar o plugin
function fintrack_init() {
    global $fintrack_plugin;
    $fintrack_plugin = new FinTrack_Plugin();
    
    // Registrar configurações
    add_action('admin_init', 'fintrack_register_settings');
}
add_action('plugins_loaded', 'fintrack_init');

/**
 * Registrar configurações do plugin
 */
function fintrack_register_settings() {
    register_setting('fintrack_options', 'fintrack_supabase_url');
    register_setting('fintrack_options', 'fintrack_supabase_key');
    register_setting('fintrack_options', 'fintrack_primary_color');
    register_setting('fintrack_options', 'fintrack_app_name');
    register_setting('fintrack_options', 'fintrack_webhook_url');
    
    add_settings_section(
        'fintrack_section_api',
        'Configurações de API',
        'fintrack_section_api_callback',
        'fintrack'
    );
    
    add_settings_field(
        'fintrack_supabase_url',
        'URL do Supabase',
        'fintrack_supabase_url_callback',
        'fintrack',
        'fintrack_section_api'
    );
    
    add_settings_field(
        'fintrack_supabase_key',
        'Chave do Supabase',
        'fintrack_supabase_key_callback',
        'fintrack',
        'fintrack_section_api'
    );
    
    add_settings_field(
        'fintrack_webhook_url',
        'URL do Webhook',
        'fintrack_webhook_url_callback',
        'fintrack',
        'fintrack_section_api'
    );
    
    add_settings_section(
        'fintrack_section_appearance',
        'Aparência',
        'fintrack_section_appearance_callback',
        'fintrack'
    );
    
    add_settings_field(
        'fintrack_app_name',
        'Nome do Aplicativo',
        'fintrack_app_name_callback',
        'fintrack',
        'fintrack_section_appearance'
    );
    
    add_settings_field(
        'fintrack_primary_color',
        'Cor Primária',
        'fintrack_primary_color_callback',
        'fintrack',
        'fintrack_section_appearance'
    );
}

/**
 * Callbacks para as seções e campos de configuração
 */
function fintrack_section_api_callback() {
    echo '<p>Configure as chaves de API necessárias para conectar ao Supabase.</p>';
}

function fintrack_section_appearance_callback() {
    echo '<p>Personalize a aparência do FinTrack.</p>';
}

function fintrack_supabase_url_callback() {
    $value = get_option('fintrack_supabase_url', '');
    echo '<input type="url" id="fintrack_supabase_url" name="fintrack_supabase_url" value="' . esc_attr($value) . '" class="regular-text">';
    echo '<p class="description">URL do seu projeto Supabase (ex: https://xyzproject.supabase.co)</p>';
}

function fintrack_supabase_key_callback() {
    $value = get_option('fintrack_supabase_key', '');
    echo '<input type="password" id="fintrack_supabase_key" name="fintrack_supabase_key" value="' . esc_attr($value) . '" class="regular-text">';
    echo '<p class="description">Chave de API anon/public do seu projeto Supabase</p>';
}

function fintrack_webhook_url_callback() {
    $value = get_option('fintrack_webhook_url', 'https://webhook.dev.solandox.com/webhook/fintrack');
    echo '<input type="url" id="fintrack_webhook_url" name="fintrack_webhook_url" value="' . esc_attr($value) . '" class="regular-text">';
    echo '<p class="description">URL do webhook para processamento de dados (n8n)</p>';
}

function fintrack_app_name_callback() {
    $value = get_option('fintrack_app_name', 'FinTrack');
    echo '<input type="text" id="fintrack_app_name" name="fintrack_app_name" value="' . esc_attr($value) . '" class="regular-text">';
}

function fintrack_primary_color_callback() {
    $value = get_option('fintrack_primary_color', '#22c55e');
    echo '<input type="color" id="fintrack_primary_color" name="fintrack_primary_color" value="' . esc_attr($value) . '">';
}

/**
 * Ativação do plugin
 */
function fintrack_activate() {
    // Configurar valores padrão
    if (!get_option('fintrack_app_name')) {
        update_option('fintrack_app_name', 'FinTrack');
    }
    
    if (!get_option('fintrack_primary_color')) {
        update_option('fintrack_primary_color', '#22c55e');
    }
    
    if (!get_option('fintrack_webhook_url')) {
        update_option('fintrack_webhook_url', 'https://webhook.dev.solandox.com/webhook/fintrack');
    }
    
    // Criar diretórios necessários
    $upload_dir = wp_upload_dir();
    $fintrack_dir = $upload_dir['basedir'] . '/fintrack';
    
    if (!file_exists($fintrack_dir)) {
        wp_mkdir_p($fintrack_dir);
    }
    
    // Garantir que o arquivo index.php existe no diretório para proteger contra listagem
    if (!file_exists($fintrack_dir . '/index.php')) {
        $index_file = @fopen($fintrack_dir . '/index.php', 'w');
        if ($index_file) {
            fwrite($index_file, '<?php // Silence is golden');
            fclose($index_file);
        }
    }
}
register_activation_hook(__FILE__, 'fintrack_activate');

/**
 * Desativação do plugin
 */
function fintrack_deactivate() {
    // Ações a serem executadas na desativação
}
register_deactivation_hook(__FILE__, 'fintrack_deactivate');