import React from 'react';
import {
  CardProps,
  CardHeaderProps,
  CardBodyProps,
  CardActionsProps,
  CardTitleProps,
  CardDescriptionProps,
  CardFooterProps,
} from './Card.types';

const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Actions: React.FC<CardActionsProps>;
  Title: React.FC<CardTitleProps>;
  Description: React.FC<CardDescriptionProps>;
  Footer: React.FC<CardFooterProps>;
} = ({ children, className = '' }) => {
  return (
    <div className={`card bg-base-100 shadow-xl border border-base-300/20 hover:shadow-2xl transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`card-body pb-0 ${className}`}>
      {children}
    </div>
  );
};

const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return (
    <div className={`card-body ${className}`}>
      {children}
    </div>
  );
};

const CardActions: React.FC<CardActionsProps> = ({ children, className = '' }) => {
  return (
    <div className={`card-actions justify-end ${className}`}>
      {children}
    </div>
  );
};

const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return (
    <h2 className={`card-title ${className}`}>
      {children}
    </h2>
  );
};

const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-sm opacity-70 ${className}`}>
      {children}
    </p>
  );
};

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`card-body pt-0 ${className}`}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Actions = CardActions;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Footer = CardFooter;

export { Card };