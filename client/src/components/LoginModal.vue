<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

defineProps({
    show: Boolean
})

const emit = defineEmits(['close', 'switch-to-register'])

const userStore = useUserStore()
const email = ref('')
const password = ref('')
const errorMessage = ref('')

const handleLogin = async () => {
    errorMessage.value = ''
    try {
        await userStore.login(email.value, password.value)
        // Reset form and close modal on success
        email.value = ''
        password.value = ''
        emit('close')
    } catch (error) {
        errorMessage.value = error.message || 'Erro ao fazer login'
    }
}

const switchForm = () => {
    emit('switch-to-register')
}
</script>

<template>
    <div v-if="show" class="modal-overlay" @click="emit('close')">
        <div class="modal-content" @click.stop>
            <button class="close-btn" @click="emit('close')">✕</button>

            <h2>Entrar</h2>

            <form @submit.prevent="handleLogin">
                <div v-if="errorMessage" class="error-message">
                    {{ errorMessage }}
                </div>

                <div class="form-group">
                    <label for="email">E-mail</label>
                    <input id="email" v-model="email" type="email" required placeholder="seu@email.com" />
                </div>

                <div class="form-group">
                    <label for="password">Senha</label>
                    <input id="password" v-model="password" type="password" required placeholder="Sua senha" />
                </div>

                <button type="submit" class="btn-submit" :disabled="userStore.loading">
                    {{ userStore.loading ? 'Entrando...' : 'Entrar' }}
                </button>
            </form>

            <p class="form-switch">
                Não tem conta?
                <button type="button" @click="switchForm" class="link-btn">Registre-se</button>
            </p>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-overlay);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: var(--color-surface);
    border-radius: 8px;
    padding: 32px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
    font-family: Arial, Helvetica, sans-serif;
}

@media (max-width: 480px) {
    .modal-content {
        padding: 20px;
        max-width: calc(100vw - 24px);
    }
}

.close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--color-text-muted);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    color: var(--color-text);
}

h2 {
    margin-top: 0;
    margin-bottom: 24px;
    color: var(--color-text);
}

.error-message {
    background-color: var(--color-error-background);
    color: var(--color-error);
    border: 1px solid var(--color-error-border);
    padding: 10px 12px;
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 14px;
}

.form-group {
    margin-bottom: 16px;
}

label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    color: var(--color-text);
    font-size: 14px;
}

input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--color-border-light);
    border-radius: 4px;
    font-size: 14px;
    font-family: Arial, Helvetica, sans-serif;
    box-sizing: border-box;
}

input:focus {
    outline: none;
    border-color: var(--color-button-hover);
    box-shadow: 0 0 0 3px var(--color-glow);
}

.btn-submit {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 600;
    margin-top: 8px;
    transition: background-color 0.3s ease;
}

.btn-submit:hover:not(:disabled) {
    background-color: var(--color-button-hover);
}

.btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.form-switch {
    text-align: center;
    margin-top: 16px;
    font-size: 14px;
    color: var(--color-text-muted);
}

.link-btn {
    background: none;
    border: none;
    color: var(--color-button);
    cursor: pointer;
    font-weight: 600;
    padding: 0;
    text-decoration: none;
}

.link-btn:hover {
    text-decoration: underline;
}
</style>