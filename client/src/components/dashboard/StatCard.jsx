import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

function AnimatedCounter({ end }) {
  return <span>{end.toLocaleString()}</span>;
}

function StatCard({ title, value, icon: Icon, trend, trendValue, color = 'primary', delay = 0 }) {
  const colorMap = {
    primary: {
      iconBg: 'bg-primary-100 dark:bg-primary-900/40',
      iconColor: 'text-primary-600 dark:text-primary-400',
      gradient: 'from-primary-500/5 to-primary-600/5 dark:from-primary-500/10 dark:to-primary-600/10',
      border: 'border-primary-100 dark:border-primary-800/30',
    },
    success: {
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      gradient: 'from-emerald-500/5 to-emerald-600/5 dark:from-emerald-500/10 dark:to-emerald-600/10',
      border: 'border-emerald-100 dark:border-emerald-800/30',
    },
    warning: {
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      gradient: 'from-amber-500/5 to-amber-600/5 dark:from-amber-500/10 dark:to-amber-600/10',
      border: 'border-amber-100 dark:border-amber-800/30',
    },
    error: {
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600 dark:text-red-400',
      gradient: 'from-red-500/5 to-red-600/5 dark:from-red-500/10 dark:to-red-600/10',
      border: 'border-red-100 dark:border-red-800/30',
    },
    blue: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-500/5 to-blue-600/5 dark:from-blue-500/10 dark:to-blue-600/10',
      border: 'border-blue-100 dark:border-blue-800/30',
    },
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <div
      className={`glass-card p-6 bg-gradient-to-br ${colors.gradient} card-hover animate-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            <AnimatedCounter end={typeof value === 'number' ? value : parseInt(value) || 0} />
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-semibold ${
                  trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trendValue}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">vs last week</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${colors.iconBg}`}>
          <Icon className={`w-6 h-6 ${colors.iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
