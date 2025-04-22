/**
 * Script de administração para o plugin FinTrack
 */
(function($) {
    'use strict';

    // Variáveis principais
    var app = {
        init: function() {
            // Verificar se estamos na página correta
            if (!$('#fintrack-admin-app').length) {
                return;
            }

            // Adicionar elementos da UI
            this.setupUI();
            
            // Verificar configuração do Supabase
            this.checkSupabaseConfig();
            
            // Inicializar tabs
            this.initTabs();
            
            // Inicializar formulários
            this.initForms();
        },
        
        setupUI: function() {
            var $app = $('#fintrack-admin-app');
            
            // Limpar conteúdo existente
            $app.empty();
            
            // Adicionar cabeçalho
            $app.append(
                '<div class="fintrack-header">' +
                    '<span class="dashicons dashicons-chart-area"></span>' +
                    '<h2>Painel FinTrack</h2>' +
                '</div>'
            );
            
            // Adicionar status
            $app.append(
                '<div class="fintrack-status" id="fintrack-connection-status">' +
                    'Verificando configuração do Supabase...' +
                '</div>'
            );
            
            // Adicionar tabs
            $app.append(
                '<div class="fintrack-tabs">' +
                    '<div class="fintrack-tab active" data-tab="overview">Visão Geral</div>' +
                    '<div class="fintrack-tab" data-tab="settings">Configurações</div>' +
                    '<div class="fintrack-tab" data-tab="help">Ajuda</div>' +
                '</div>'
            );
            
            // Adicionar conteúdo das tabs
            $app.append('<div class="fintrack-tab-content" id="fintrack-tab-content"></div>');
            
            // Mostrar a primeira tab
            this.showTab('overview');
        },
        
        checkSupabaseConfig: function() {
            var $status = $('#fintrack-connection-status');
            
            if (!fintrackParams.supabaseUrl || !fintrackParams.supabaseKey) {
                $status.html('⚠️ Configuração incompleta. Por favor, configure as credenciais do Supabase.');
                $status.addClass('warning');
                return;
            }
            
            $status.html('✅ Configuração do Supabase encontrada.');
            $status.addClass('info');
        },
        
        initTabs: function() {
            var self = this;
            
            $('.fintrack-tab').on('click', function() {
                $('.fintrack-tab').removeClass('active');
                $(this).addClass('active');
                
                var tab = $(this).data('tab');
                self.showTab(tab);
            });
        },
        
        showTab: function(tab) {
            var $content = $('#fintrack-tab-content');
            $content.empty();
            
            switch (tab) {
                case 'overview':
                    this.showOverviewTab($content);
                    break;
                case 'settings':
                    this.showSettingsTab($content);
                    break;
                case 'help':
                    this.showHelpTab($content);
                    break;
            }
        },
        
        showOverviewTab: function($content) {
            $content.html(
                '<div class="fintrack-card">' +
                    '<div class="fintrack-card-header">Sobre o FinTrack</div>' +
                    '<div class="fintrack-card-body">' +
                        '<p>O FinTrack é um sistema completo de gerenciamento financeiro que permite acompanhar receitas, despesas, orçamentos e metas financeiras.</p>' +
                        '<p>Para usar o FinTrack em suas páginas ou posts, use o shortcode: <code>[fintrack]</code></p>' +
                        '<p>Opções do shortcode:</p>' +
                        '<ul>' +
                            '<li><code>view</code>: Visão inicial (dashboard, transactions, budgets, goals)</li>' +
                            '<li><code>height</code>: Altura do contêiner (ex: 800px)</li>' +
                        '</ul>' +
                        '<p>Exemplo: <code>[fintrack view="transactions" height="600px"]</code></p>' +
                    '</div>' +
                '</div>' +
                '<div class="fintrack-card">' +
                    '<div class="fintrack-card-header">Status</div>' +
                    '<div class="fintrack-card-body">' +
                        '<p><strong>Versão do plugin:</strong> ' + fintrackParams.version + '</p>' +
                        '<p><strong>Status da conexão:</strong> <span id="supabase-status-indicator">Verificando...</span></p>' +
                    '</div>' +
                '</div>'
            );
            
            this.checkSupabaseConnection();
        },
        
        showSettingsTab: function($content) {
            // Esta tab já é mostrada por meio do formulário de configurações padrão do WordPress
            $content.html(
                '<p>Use o formulário de configurações abaixo para personalizar o FinTrack.</p>'
            );
        },
        
        showHelpTab: function($content) {
            $content.html(
                '<div class="fintrack-card">' +
                    '<div class="fintrack-card-header">Suporte</div>' +
                    '<div class="fintrack-card-body">' +
                        '<p>Para obter ajuda com o plugin FinTrack, entre em contato:</p>' +
                        '<ul>' +
                            '<li>Email: suporte@solandox.com</li>' +
                            '<li>Website: <a href="https://solandox.com/suporte" target="_blank">solandox.com/suporte</a></li>' +
                        '</ul>' +
                    '</div>' +
                '</div>' +
                '<div class="fintrack-card">' +
                    '<div class="fintrack-card-header">Perguntas Frequentes</div>' +
                    '<div class="fintrack-card-body">' +
                        '<h4>Como obter as credenciais do Supabase?</h4>' +
                        '<p>Acesse o painel do Supabase, crie um novo projeto, e obtenha a URL e a chave anon/public nas configurações.</p>' +
                        '<h4>O FinTrack pode ser usado em qualquer página?</h4>' +
                        '<p>Sim, basta inserir o shortcode [fintrack] em qualquer página ou post onde deseja exibir o aplicativo.</p>' +
                        '<h4>É possível personalizar as cores?</h4>' +
                        '<p>Sim, você pode alterar a cor primária nas configurações do plugin.</p>' +
                    '</div>' +
                '</div>'
            );
        },
        
        checkSupabaseConnection: function() {
            var $status = $('#supabase-status-indicator');
            
            if (!fintrackParams.supabaseUrl || !fintrackParams.supabaseKey) {
                $status.html('❌ Não configurado');
                return;
            }
            
            $status.html('🔄 Verificando conexão...');
            
            // Testar a conexão com o Supabase via endpoint de proxy
            $.ajax({
                url: fintrackParams.apiUrl + 'proxy',
                method: 'POST',
                data: {
                    endpoint: '/rest/v1/categories?limit=1',
                    method: 'GET'
                },
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', fintrackParams.nonce);
                },
                success: function() {
                    $status.html('✅ Conectado');
                },
                error: function() {
                    $status.html('❌ Erro de conexão');
                }
            });
        },
        
        initForms: function() {
            // Inicializar validações e comportamentos específicos dos formulários aqui
        }
    };

    // Inicializar quando o documento estiver pronto
    $(document).ready(function() {
        app.init();
    });

})(jQuery);