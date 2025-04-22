/**
 * Script para o frontend do plugin FinTrack
 */
(function($) {
    'use strict';

    // Aplicativo principal
    var fintrackApp = {
        init: function() {
            // Verificar se o contêiner está presente
            var $container = $('#fintrack-app');
            if (!$container.length) {
                return;
            }
            
            // Verificar configuração
            if (!this.checkConfig()) {
                return;
            }
            
            // Inicializar a visualização
            this.initView($container);
        },
        
        checkConfig: function() {
            if (!fintrackPublicParams.supabaseUrl || !fintrackPublicParams.supabaseKey) {
                this.showError('O FinTrack não foi configurado corretamente. Por favor, configure as credenciais do Supabase no painel de administração.');
                return false;
            }
            
            return true;
        },
        
        showError: function(message) {
            var $container = $('#fintrack-app');
            $container.html('<div class="fintrack-error"><p>' + message + '</p></div>');
        },
        
        showLoading: function() {
            var $container = $('#fintrack-app');
            $container.html(
                '<div class="fintrack-loading">' +
                    '<div class="spinner"></div>' +
                    '<h2>Carregando FinTrack...</h2>' +
                '</div>'
            );
        },
        
        initView: function($container) {
            var self = this;
            var view = $container.data('view') || 'dashboard';
            
            // Mostrar carregamento
            this.showLoading();
            
            // Criar iframe para hospedar a aplicação
            var $iframe = $('<iframe>', {
                src: this.buildAppUrl(view),
                id: 'fintrack-iframe',
                class: 'fintrack-iframe',
                frameborder: 0,
                allowtransparency: true
            });
            
            // Quando o iframe carregar
            $iframe.on('load', function() {
                // Remover a mensagem de carregamento
                $container.find('.fintrack-loading').remove();
                
                // Configurar comunicação entre o iframe e a página pai
                self.setupPostMessageCommunication();
            });
            
            // Adicionar o iframe ao contêiner
            $container.append($iframe);
        },
        
        buildAppUrl: function(view) {
            // Montar URL com os parâmetros necessários
            var baseUrl = 'https://solandox.com/fintrack/embedded';
            
            var params = {
                view: view,
                supabaseUrl: fintrackPublicParams.supabaseUrl,
                supabaseKey: fintrackPublicParams.supabaseKey,
                appName: fintrackPublicParams.appName || 'FinTrack',
                primaryColor: fintrackPublicParams.primaryColor || '#22c55e',
                origin: window.location.origin
            };
            
            // Converter parâmetros para query string
            var queryString = Object.keys(params)
                .map(function(key) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
                })
                .join('&');
            
            return baseUrl + '?' + queryString;
        },
        
        setupPostMessageCommunication: function() {
            // Configurar comunicação entre o iframe e a página pai
            window.addEventListener('message', function(event) {
                // Verificar origem da mensagem (segurança)
                if (event.origin !== 'https://solandox.com') {
                    return;
                }
                
                var message = event.data;
                
                // Processar diferentes tipos de mensagens
                switch (message.type) {
                    case 'fintrack:ready':
                        console.log('FinTrack está pronto');
                        break;
                    
                    case 'fintrack:height':
                        // Ajustar altura do iframe se necessário
                        if (message.height) {
                            $('#fintrack-iframe').css('height', message.height + 'px');
                        }
                        break;
                    
                    case 'fintrack:error':
                        console.error('Erro no FinTrack:', message.error);
                        break;
                }
            });
        }
    };
    
    // Inicializar quando o documento estiver pronto
    $(document).ready(function() {
        fintrackApp.init();
    });

})(jQuery);